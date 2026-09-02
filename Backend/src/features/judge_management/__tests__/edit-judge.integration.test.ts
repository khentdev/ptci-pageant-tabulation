import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { EditJudgeResponse } from "../types.js"

describe("Edit Judge Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Edit Judge Admin",
        username: "test-edit-judge-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Edit Judge Judge",
        username: "test-edit-judge-judge",
        role: "JUDGE" as Role,
    }
    const TARGET_JUDGE = {
        name: "Judge One",
        username: "test-edit-judge-target",
        role: "JUDGE" as Role,
    }
    const OTHER_JUDGE = {
        name: "Judge Two",
        username: "test-edit-judge-other",
        role: "JUDGE" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const validBody = {
        name: "Updated Judge",
        username: "test-edit-judge-updated",
    }

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        TARGET_JUDGE.username,
        OTHER_JUDGE.username,
        validBody.username,
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

    const patchEditJudge = async (
        cookieHeader: string,
        csrfToken: string,
        id: number | string,
        body: Record<string, unknown>,
    ) => {
        return app.request(`/judges/${id}`, {
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
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(validBody),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to edit a judge", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should update judge name and username", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, validBody)
            const json = await res.json() as EditJudgeResponse

            expect(res.status).toBe(200)
            expect(json.message).toBe("Judge updated successfully.")

            const updatedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { name: true, username: true, role: true },
            })
            expect(updatedJudge).toEqual({
                name: validBody.name,
                username: validBody.username,
                role: "JUDGE",
            })
        })

        it("should allow keeping the same username", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, {
                name: "Renamed Judge",
                username: TARGET_JUDGE.username,
            })
            expect(res.status).toBe(200)

            const updatedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { name: true, username: true },
            })
            expect(updatedJudge).toEqual({
                name: "Renamed Judge",
                username: TARGET_JUDGE.username,
            })
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

            const res = await patchEditJudge(cookieHeader, csrfToken, id, validBody)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe("edit_judge_input_id")
        })

        it.each([
            {
                testCase: "name is too short",
                body: { ...validBody, name: "Jo" },
                code: "JUDGE_NAME_TOO_SHORT",
                field: "judge_name_input",
            },
            {
                testCase: "username is too short",
                body: { ...validBody, username: "ab" },
                code: "JUDGE_USERNAME_TOO_SHORT",
                field: "judge_username_input",
            },
        ])("should return $code if $testCase", async ({ body, code, field }) => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, body)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })
    })

    describe("business rules", () => {
        it("should return JUDGE_NOT_FOUND when the judge does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, 99999, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })

        it("should return JUDGE_NOT_FOUND when the id belongs to an admin", async () => {
            const admin = await seedUser(TEST_ADMIN)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_ADMIN.username)

            const res = await patchEditJudge(cookieHeader, csrfToken, admin.id, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })

        it("should return JUDGE_USERNAME_EXISTS when username is taken by another judge", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedUser(OTHER_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, {
                name: "Updated Judge",
                username: OTHER_JUDGE.username,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_USERNAME_EXISTS")
        })

        it("should return JUDGE_USERNAME_EXISTS when username matches an existing admin", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, {
                name: "Updated Judge",
                username: TEST_ADMIN.username,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_USERNAME_EXISTS")
        })
    })

    describe("no lock", () => {
        it("should still allow editing when the judge already has scores", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedJudgeWithScores(targetJudge.id)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditJudge(cookieHeader, csrfToken, targetJudge.id, validBody)
            expect(res.status).toBe(200)

            const updatedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { name: true, username: true },
            })
            expect(updatedJudge).toEqual({
                name: validBody.name,
                username: validBody.username,
            })
        })
    })
})
