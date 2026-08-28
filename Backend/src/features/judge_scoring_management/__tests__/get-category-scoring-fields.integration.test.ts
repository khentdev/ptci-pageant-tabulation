import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetCategoryScoringFieldsResponse } from "../types.js"

describe("Get Category Scoring Fields Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Category Fields Admin",
        username: "test-get-scoring-fields-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Category Fields Judge",
        username: "test-get-scoring-fields-judge",
        role: "JUDGE" as Role,
    }

    const testUsernames = [TEST_ADMIN.username, TEST_JUDGE.username]

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const postLogin = (username: string) =>
        app.request("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify({ username, password: TEST_PASSWORD }),
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

    const getCategoryFields = (cookieHeader: string, csrfToken: string, categoryId: number | string) =>
        app.request(`/judge-scoring/categories/${categoryId}/fields`, {
            method: "GET",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
        })

    const seedUser = async (user: { name: string; username: string; role: Role }) => {
        const hashedPassword = await argon2.hash(TEST_PASSWORD)
        return prisma.user.create({
            data: { name: user.name, username: user.username, hashedPassword, role: user.role },
            select: { id: true },
        })
    }

    const seedAdminCredentials = async () => {
        await seedUser(TEST_ADMIN)
        return loginAndGetCredentials(TEST_ADMIN.username)
    }

    const seedJudgeCredentials = async () => {
        await seedUser(TEST_JUDGE)
        return loginAndGetCredentials(TEST_JUDGE.username)
    }

    const seedRound = async (data: { name: string; phaseOrder: number }) =>
        prisma.round.create({
            data: { name: data.name, phaseOrder: data.phaseOrder },
            select: { id: true },
        })

    const seedCategory = async (data: { name: string; roundId: number }) =>
        prisma.category.create({
            data: { name: data.name, roundId: data.roundId },
            select: { id: true },
        })

    const seedCriteriaField = async (categoryId: number, name: string, maxValue: number) =>
        prisma.criteriaField.create({
            data: { categoryId, name, maxValue },
            select: { id: true },
        })

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.roundWinner.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({ where: { username: { in: testUsernames } } })
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
            const res = await app.request("/judge-scoring/categories/1/fields")
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if an admin attempts to view scoring fields", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return fields ordered by max value descending", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaField(category.id, "Poise", 35)
            await seedCriteriaField(category.id, "Stage Presence", 40)
            await seedCriteriaField(category.id, "Confidence", 25)

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            const json = await res.json() as GetCategoryScoringFieldsResponse

            expect(res.status).toBe(200)
            expect(json.data.categoryId).toBe(category.id)
            expect(json.data.categoryName).toBe("Swimwear")
            expect(json.data.roundId).toBe(round.id)
            expect(json.data.fields.map((field) => field.name)).toEqual(["Stage Presence", "Poise", "Confidence"])
            expect(json.data.fields.map((field) => field.maxValue)).toEqual([40, 35, 25])
        })

        it("should return an empty fields array when no scoring fields are configured yet", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            const json = await res.json() as GetCategoryScoringFieldsResponse

            expect(res.status).toBe(200)
            expect(json.data.fields).toEqual([])
        })
    })

    describe("validation", () => {
        it.each([
            { testCase: "id is not numeric", id: "abc" },
            { testCase: "id is zero", id: "0" },
            { testCase: "id is negative", id: "-1" },
        ])("should return SCORING_CATEGORY_ID_INVALID if $testCase", async ({ id }) => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_CATEGORY_ID_INVALID")
            expect(json.error.field).toBe("get_category_scoring_fields_input_id")
        })
    })

    describe("business rules", () => {
        it("should return SCORING_CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, 999999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("SCORING_CATEGORY_NOT_FOUND")
        })
    })
})
