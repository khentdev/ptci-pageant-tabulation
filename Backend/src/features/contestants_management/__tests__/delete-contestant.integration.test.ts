import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { AddContestantResponse, DeleteContestantResponse } from "../types.js"

describe("Delete Contestant Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Delete Contestant Admin",
        username: "test-delete-contestant-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Delete Contestant Judge",
        username: "test-delete-contestant-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Delete Contestant Score Judge",
        username: "test-delete-contestant-score-judge",
        role: "JUDGE" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const validAddBody = {
        candidateNumber: "1",
        name: "Aniar, Andrea Mae",
        gender: "FEMALE",
        teamName: "Yellow Team",
        teamColor: "Yellow",
    }

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

    const deleteContestant = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/contestants/${id}`, {
            method: "DELETE",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
        })

    const postAddContestant = async (
        cookieHeader: string,
        csrfToken: string,
        body: Record<string, unknown>,
    ) => {
        return app.request("/contestants", {
            method: "POST",
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

    const seedContestant = async (data: {
        candidateNumber: number
        name: string
        gender: "MALE" | "FEMALE"
        teamName: string
        teamColor: string
    }) => {
        return prisma.contestant.create({
            data,
            select: {
                id: true,
                candidateNumber: true,
                name: true,
                gender: true,
                teamName: true,
                teamColor: true,
            },
        })
    }

    const seedRound = async (data: { name: string; phaseOrder: number; contestantLimit?: number | null }) => {
        return prisma.round.create({
            data: {
                name: data.name,
                phaseOrder: data.phaseOrder,
                contestantLimit: data.contestantLimit ?? null,
            },
            select: {
                id: true,
            },
        })
    }

    const seedCategory = async (data: { name: string; roundId: number }) => {
        return prisma.category.create({
            data: {
                name: data.name,
                roundId: data.roundId,
            },
            select: {
                id: true,
            },
        })
    }

    const seedContestantWithScores = async () => {
        const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
        const category = await seedCategory({ name: "Swimwear", roundId: round.id })
        const criteriaField = await prisma.criteriaField.create({
            data: {
                categoryId: category.id,
                name: "Stage Presence",
                maxValue: 100,
            },
            select: { id: true },
        })
        const judge = await seedUser(TEST_SCORE_JUDGE)
        const contestant = await seedContestant({
            candidateNumber: 1,
            name: "Test Contestant",
            gender: "FEMALE",
            teamName: "Team A",
            teamColor: "Red",
        })

        await prisma.score.create({
            data: {
                judgeId: judge.id,
                contestantId: contestant.id,
                categoryId: category.id,
                criteriaFieldId: criteriaField.id,
                value: 85,
            },
        })

        return { contestant, criteriaField, category }
    }

    beforeEach(async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username, TEST_SCORE_JUDGE.username],
                },
            },
        })
    })

    afterAll(async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username, TEST_SCORE_JUDGE.username],
                },
            },
        })
        await prisma.$disconnect()
    })

    describe("authenticate", () => {
        it("should return 401 Unauthorized if no credentials are provided", async () => {
            const res = await app.request("/contestants/1", {
                method: "DELETE",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to delete a contestant", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await deleteContestant(cookieHeader, csrfToken, contestant.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { id: true },
            })
            expect(unchangedContestant).not.toBeNull()
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "contestant id is not a number",
                id: "abc",
                code: "CONTESTANT_ID_INVALID",
            },
            {
                testCase: "contestant id is zero",
                id: "0",
                code: "CONTESTANT_ID_INVALID",
            },
            {
                testCase: "contestant id is negative",
                id: "-1",
                code: "CONTESTANT_ID_INVALID",
            },
            {
                testCase: "contestant id is not an integer",
                id: "1.5",
                code: "CONTESTANT_ID_INVALID",
            },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteContestant(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe("delete_contestant_input")
        })
    })

    describe("happy path", () => {
        it("should delete a contestant with no scores", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteContestant(cookieHeader, csrfToken, contestant.id)
            const json = await res.json() as DeleteContestantResponse

            expect(res.status).toBe(200)
            expect(json.message).toBe("Contestant deleted successfully")

            const deletedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { id: true },
            })
            expect(deletedContestant).toBeNull()
        })

        it("should not affect sibling contestants when deleting one contestant", async () => {
            const contestantOne = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const contestantTwo = await seedContestant({
                candidateNumber: 2,
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteContestant(cookieHeader, csrfToken, contestantOne.id)
            expect(res.status).toBe(200)

            const siblingContestant = await prisma.contestant.findUnique({
                where: { id: contestantTwo.id },
                select: {
                    id: true,
                    candidateNumber: true,
                    name: true,
                },
            })
            expect(siblingContestant).toEqual({
                id: contestantTwo.id,
                candidateNumber: 2,
                name: "Dela Cruz, Christine",
            })
        })
    })

    describe("business rules", () => {
        it("should return CONTESTANT_NOT_FOUND when the contestant does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteContestant(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CONTESTANT_NOT_FOUND")
        })

        it("should return CONTESTANT_NOT_FOUND when deleting the same contestant twice", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const firstDelete = await deleteContestant(cookieHeader, csrfToken, contestant.id)
            expect(firstDelete.status).toBe(200)

            const secondDelete = await deleteContestant(cookieHeader, csrfToken, contestant.id)
            const json = await secondDelete.json() as { error: { code: string } }

            expect(secondDelete.status).toBe(404)
            expect(json.error.code).toBe("CONTESTANT_NOT_FOUND")
        })

        it("should return CONTESTANT_LOCKED when scores exist for the contestant", async () => {
            const { contestant } = await seedContestantWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteContestant(cookieHeader, csrfToken, contestant.id)
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_LOCKED")
            expect(json.error.message).toBe("Contestant cannot be edited because it has scores already.")

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { id: true },
            })
            expect(unchangedContestant).not.toBeNull()
        })

        it("should not remove score records when delete is rejected due to scores", async () => {
            const { contestant } = await seedContestantWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await deleteContestant(cookieHeader, csrfToken, contestant.id)

            const scoreCount = await prisma.score.count({
                where: { contestantId: contestant.id },
            })
            expect(scoreCount).toBe(1)
        })
    })

    describe("edge cases", () => {
        it("should delete an unlocked contestant when another contestant has scores", async () => {
            const { contestant: lockedContestant } = await seedContestantWithScores()
            const unlockedContestant = await seedContestant({
                candidateNumber: 2,
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteContestant(cookieHeader, csrfToken, unlockedContestant.id)
            expect(res.status).toBe(200)

            const deletedContestant = await prisma.contestant.findUnique({
                where: { id: unlockedContestant.id },
                select: { id: true },
            })
            expect(deletedContestant).toBeNull()

            const lockedStillExists = await prisma.contestant.findUnique({
                where: { id: lockedContestant.id },
                select: { id: true },
            })
            expect(lockedStillExists).not.toBeNull()
        })

        it("should allow reusing candidate number after successful delete", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const deleteRes = await deleteContestant(cookieHeader, csrfToken, contestant.id)
            expect(deleteRes.status).toBe(200)

            const addRes = await postAddContestant(cookieHeader, csrfToken, validAddBody)
            expect(addRes.status).toBe(201)

            const json = await addRes.json() as AddContestantResponse
            expect(json.message).toBe("Contestant added successfully")

            const newContestant = await prisma.contestant.findFirst({
                where: { candidateNumber: 1 },
                select: { name: true },
            })
            expect(newContestant?.name).toBe("Aniar, Andrea Mae")
        })
    })
})
