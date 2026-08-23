import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { DeleteRoundPhaseResponse } from "../types.js"

describe("Delete Round Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Delete Round Admin",
        username: "test-delete-round-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Delete Round Judge",
        username: "test-delete-round-judge",
        role: "JUDGE" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const postLogin = (username: string) =>
        app.request("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify({
                username,
                password: TEST_PASSWORD,
            }),
        })

    const loginAndGetCredentials = async (username: string) => {
        const loginRes = await postLogin(username)
        expect(loginRes.status).toBe(200)

        const rawCookies = loginRes.headers.getSetCookie()
        const cookieHeader = rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")

        const csrfCookiePair = rawCookies.find((cookie) => cookie.startsWith("csrfToken="))
        const csrfToken = csrfCookiePair?.split(";")[0]!.replace("csrfToken=", "") ?? ""

        return { cookieHeader, csrfToken }
    }

    const deleteRound = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/rounds/${id}`, {
            method: "DELETE",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
        })

    const seedUser = async (user: { name: string; username: string; role: Role }) => {
        const hashedPassword = await argon2.hash(TEST_PASSWORD)
        return prisma.user.create({
            data: {
                name: user.name,
                username: user.username,
                hashedPassword,
                role: user.role,
            },
            select: {
                id: true,
                username: true,
                role: true,
            },
        })
    }

    const seedAdminCredentials = async () => {
        await seedUser(TEST_ADMIN)
        return loginAndGetCredentials(TEST_ADMIN.username)
    }

    const seedRound = async (data: { name: string; phaseOrder: number; contestantLimit: number | null }) => {
        return prisma.round.create({
            data,
            select: {
                id: true,
                name: true,
                phaseOrder: true,
                contestantLimit: true,
            },
        })
    }

    const seedRoundWithCategory = async () => {
        const round = await seedRound({
            name: "Top 10",
            phaseOrder: 2,
            contestantLimit: 10,
        })

        await prisma.category.create({
            data: {
                roundId: round.id,
                name: "Swimwear",
            },
        })

        return round
    }

    const seedRoundWithContestants = async () => {
        const round = await seedRound({
            name: "Top 10",
            phaseOrder: 2,
            contestantLimit: 10,
        })

        const contestant = await prisma.contestant.create({
            data: {
                candidateNumber: 1,
                name: "Test Contestant",
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            },
        })

        await prisma.roundContestant.create({
            data: {
                roundId: round.id,
                contestantId: contestant.id,
            },
        })

        return round
    }

    const seedRoundWithCategoryAndContestants = async () => {
        const round = await seedRoundWithContestants()

        await prisma.category.create({
            data: {
                roundId: round.id,
                name: "Talent",
            },
        })

        return round
    }

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.category.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username],
                },
            },
        })
    }

    beforeEach(async () => {
        await cleanupTestData()
    })

    afterAll(async () => {
        await cleanupTestData()
        await prisma.$disconnect()
    })

    describe("authenticate", () => {
        it("should return 401 Unauthorized if no credentials are provided", async () => {
            const res = await app.request("/rounds/1", {
                method: "DELETE",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to delete a round", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await deleteRound(cookieHeader, csrfToken, round.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")

            const unchangedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true },
            })
            expect(unchangedRound).not.toBeNull()
        })
    })

    describe("happy path", () => {
        it("should delete an empty round with no categories or contestants", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as DeleteRoundPhaseResponse
            expect(json.message).toBe("Round phase deleted successfully")

            const deletedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true },
            })
            expect(deletedRound).toBeNull()
        })

        it("should allow deleting an empty preliminary round", async () => {
            const round = await seedRound({
                name: "Preliminary",
                phaseOrder: 1,
                contestantLimit: null,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const deletedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true },
            })
            expect(deletedRound).toBeNull()
        })

        it("should only delete the targeted round and leave other rounds intact", async () => {
            const preliminary = await seedRound({
                name: "Preliminary",
                phaseOrder: 1,
                contestantLimit: null,
            })
            const top10 = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, top10.id)
            expect(res.status).toBe(200)

            const remainingRounds = await prisma.round.findMany({
                orderBy: { phaseOrder: "asc" },
                select: {
                    id: true,
                    name: true,
                    phaseOrder: true,
                },
            })

            expect(remainingRounds).toEqual([
                {
                    id: preliminary.id,
                    name: "Preliminary",
                    phaseOrder: 1,
                },
            ])
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "round id is not a number",
                id: "abc",
                code: "ROUND_ID_INVALID",
            },
            {
                testCase: "round id is zero",
                id: "0",
                code: "ROUND_ID_INVALID",
            },
            {
                testCase: "round id is negative",
                id: "-1",
                code: "ROUND_ID_INVALID",
            },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })

        it("should return ROUND_PHASE_NOT_FOUND when deleting the same round twice", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const firstDelete = await deleteRound(cookieHeader, csrfToken, round.id)
            expect(firstDelete.status).toBe(200)

            const secondDelete = await deleteRound(cookieHeader, csrfToken, round.id)
            const json = await secondDelete.json() as { error: { code: string } }

            expect(secondDelete.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })

        it("should return ROUND_PHASE_CATEGORY_LOCKED when the round has categories", async () => {
            const round = await seedRoundWithCategory()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, round.id)
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_PHASE_CATEGORY_LOCKED")
            expect(json.error.message).toBe("Round phase cannot be deleted because it has categories.")

            const unchangedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true },
            })
            expect(unchangedRound).not.toBeNull()
        })

        it("should return ROUND_PHASE_HAS_CONTESTANTS when contestants have advanced but no categories exist", async () => {
            const round = await seedRoundWithContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, round.id)
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_PHASE_HAS_CONTESTANTS")
            expect(json.error.message).toBe("Round phase cannot be deleted because it has contestants.")

            const unchangedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true },
            })
            expect(unchangedRound).not.toBeNull()
        })

        it("should return ROUND_PHASE_CATEGORY_LOCKED before checking contestants when both exist", async () => {
            const round = await seedRoundWithCategoryAndContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteRound(cookieHeader, csrfToken, round.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_PHASE_CATEGORY_LOCKED")
        })
    })
})
