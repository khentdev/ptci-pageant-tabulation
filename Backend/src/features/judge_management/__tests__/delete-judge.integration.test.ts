import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { DeleteJudgeResponse } from "../types.js"

describe("Delete Judge Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Delete Judge Admin",
        username: "test-delete-judge-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Delete Judge Judge",
        username: "test-delete-judge-judge",
        role: "JUDGE" as Role,
    }
    const TARGET_JUDGE = {
        name: "Judge One",
        username: "test-delete-judge-target",
        role: "JUDGE" as Role,
    }
    const OTHER_JUDGE = {
        name: "Judge Two",
        username: "test-delete-judge-other",
        role: "JUDGE" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        TARGET_JUDGE.username,
        OTHER_JUDGE.username,
    ]

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

    const deleteJudge = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/judges/${id}`, {
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

    const seedRound = async (data: { name: string; phaseOrder: number; contestantLimit?: number | null }) => {
        return prisma.round.create({
            data: {
                name: data.name,
                phaseOrder: data.phaseOrder,
                contestantLimit: data.contestantLimit ?? null,
            },
            select: { id: true },
        })
    }

    const seedCategory = async (data: { name: string; roundId: number }) => {
        return prisma.category.create({
            data: {
                name: data.name,
                roundId: data.roundId,
            },
            select: { id: true },
        })
    }

    const seedJudgeWithScores = async (judgeId: number) => {
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
        const contestant = await prisma.contestant.create({
            data: {
                candidateNumber: 1,
                name: "Test Contestant",
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            },
            select: { id: true },
        })

        await prisma.score.create({
            data: {
                judgeId,
                contestantId: contestant.id,
                categoryId: category.id,
                criteriaFieldId: criteriaField.id,
                value: 85,
            },
        })
    }

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: testUsernames,
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
            const res = await app.request("/judges/1", {
                method: "DELETE",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to delete a judge", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await deleteJudge(cookieHeader, csrfToken, targetJudge.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")

            const unchangedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { id: true },
            })
            expect(unchangedJudge).not.toBeNull()
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "judge id is not a number",
                id: "abc",
                code: "JUDGE_ID_INVALID",
            },
            {
                testCase: "judge id is zero",
                id: "0",
                code: "JUDGE_ID_INVALID",
            },
            {
                testCase: "judge id is negative",
                id: "-1",
                code: "JUDGE_ID_INVALID",
            },
            {
                testCase: "judge id is not an integer",
                id: "1.5",
                code: "JUDGE_ID_INVALID",
            },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteJudge(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe("delete_judge_input")
        })
    })

    describe("happy path", () => {
        it("should delete a judge with no scores", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteJudge(cookieHeader, csrfToken, targetJudge.id)
            const json = await res.json() as DeleteJudgeResponse

            expect(res.status).toBe(200)
            expect(json.message).toBe("Judge deleted successfully.")

            const deletedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { id: true },
            })
            expect(deletedJudge).toBeNull()
        })

        it("should not affect sibling judges when deleting one judge", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const otherJudge = await seedUser(OTHER_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteJudge(cookieHeader, csrfToken, targetJudge.id)
            expect(res.status).toBe(200)

            const siblingJudge = await prisma.user.findUnique({
                where: { id: otherJudge.id },
                select: { id: true, username: true },
            })
            expect(siblingJudge).toEqual({
                id: otherJudge.id,
                username: OTHER_JUDGE.username,
            })
        })
    })

    describe("business rules", () => {
        it("should return JUDGE_NOT_FOUND when the judge does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteJudge(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })

        it("should return JUDGE_NOT_FOUND when the id belongs to an admin", async () => {
            const admin = await seedUser(TEST_ADMIN)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_ADMIN.username)

            const res = await deleteJudge(cookieHeader, csrfToken, admin.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })

        it("should return JUDGE_NOT_FOUND when deleting the same judge twice", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const firstDelete = await deleteJudge(cookieHeader, csrfToken, targetJudge.id)
            expect(firstDelete.status).toBe(200)

            const secondDelete = await deleteJudge(cookieHeader, csrfToken, targetJudge.id)
            const json = await secondDelete.json() as { error: { code: string } }

            expect(secondDelete.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })

        it("should return JUDGE_LOCKED when scores exist for the judge", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedJudgeWithScores(targetJudge.id)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteJudge(cookieHeader, csrfToken, targetJudge.id)
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_LOCKED")
            expect(json.error.message).toBe("Judge cannot be deleted because scores already exist.")

            const unchangedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { id: true },
            })
            expect(unchangedJudge).not.toBeNull()
        })

        it("should not remove score records when delete is rejected due to scores", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedJudgeWithScores(targetJudge.id)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await deleteJudge(cookieHeader, csrfToken, targetJudge.id)

            const scoreCount = await prisma.score.count({
                where: { judgeId: targetJudge.id },
            })
            expect(scoreCount).toBe(1)
        })
    })
})
