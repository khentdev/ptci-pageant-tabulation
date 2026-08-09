import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { EditRoundResponse } from "../types.js"

describe("Edit Round Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Edit Round Admin",
        username: "test-edit-round-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Edit Round Judge",
        username: "test-edit-round-judge",
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

    const patchEditRound = async (
        cookieHeader: string,
        csrfToken: string,
        id: number | string,
        body: Record<string, unknown>,
    ) => {
        return app.request(`/rounds/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify(body),
        })
    }

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
                contestantLimit: true,
            },
        })
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

    beforeEach(async () => {
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
    })

    afterAll(async () => {
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
        await prisma.$disconnect()
    })

    describe("authenticate", () => {
        it("should return 401 Unauthorized if no credentials are provided", async () => {
            const res = await app.request("/rounds/1", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Updated Round",
                    contestantLimit: 10,
                }),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to edit a round", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await patchEditRound(cookieHeader, csrfToken, round.id, {
                name: "Updated Top 10",
                contestantLimit: 10,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should update name and contestant limit when the round has no contestants", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditRound(cookieHeader, csrfToken, round.id, {
                name: "Top 5",
                contestantLimit: 5,
            })
            expect(res.status).toBe(200)

            const json = await res.json() as EditRoundResponse
            expect(json.message).toBe("Round edited successfully")

            const updatedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: {
                    name: true,
                    contestantLimit: true,
                },
            })
            expect(updatedRound).toEqual({
                name: "Top 5",
                contestantLimit: 5,
            })
        })

        it("should allow a name-only edit when contestants exist and the same limit is submitted", async () => {
            const round = await seedRoundWithContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditRound(cookieHeader, csrfToken, round.id, {
                name: "Top 10 Updated",
                contestantLimit: 10,
            })
            expect(res.status).toBe(200)

            const updatedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: {
                    name: true,
                    contestantLimit: true,
                },
            })
            expect(updatedRound).toEqual({
                name: "Top 10 Updated",
                contestantLimit: 10,
            })
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

            const res = await patchEditRound(cookieHeader, csrfToken, id, {
                name: "Updated Round",
                contestantLimit: 10,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })

        it.each([
            {
                testCase: "round name is empty",
                body: {
                    name: "",
                    contestantLimit: 10,
                },
                code: "ROUND_NAME_INVALID",
            },
            {
                testCase: "contestant limit is not a positive integer",
                body: {
                    name: "Top 10",
                    contestantLimit: -5,
                },
                code: "ROUND_CONTESTANT_LIMIT_INVALID",
            },
        ])("should return $code if $testCase", async ({ body, code }) => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditRound(cookieHeader, csrfToken, round.id, body)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditRound(cookieHeader, csrfToken, 99999, {
                name: "Missing Round",
                contestantLimit: 10,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })

        it("should return ROUND_CONTESTANT_LIMIT_LOCKED when changing the limit after contestants have advanced", async () => {
            const round = await seedRoundWithContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditRound(cookieHeader, csrfToken, round.id, {
                name: "Top 10",
                contestantLimit: 5,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_CONTESTANT_LIMIT_LOCKED")

            const unchangedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: {
                    name: true,
                    contestantLimit: true,
                },
            })
            expect(unchangedRound).toEqual({
                name: "Top 10",
                contestantLimit: 10,
            })
        })
    })
})
