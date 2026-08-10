import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetCategoryByIdResponse } from "../types.js"

describe("Get Category By Id Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Category By Id Admin",
        username: "test-get-category-by-id-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Category By Id Judge",
        username: "test-get-category-by-id-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Get Category By Id Score Judge",
        username: "test-get-category-by-id-score-judge",
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

    const getCategoryById = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/categories/${id}`, {
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
            select: {
                id: true,
                name: true,
                phaseOrder: true,
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
                name: true,
                roundId: true,
            },
        })
    }

    const seedCategoryWithScores = async () => {
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
                judgeId: judge.id,
                contestantId: contestant.id,
                categoryId: category.id,
                criteriaFieldId: criteriaField.id,
                value: 85,
            },
        })

        return { round, category }
    }

    beforeEach(async () => {
        await prisma.score.deleteMany()
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
            const res = await app.request("/categories/1", {
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get a category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getCategoryById(cookieHeader, csrfToken, category.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "category id is not a number",
                id: "abc",
                code: "CATEGORY_ID_INVALID",
            },
            {
                testCase: "category id is zero",
                id: "0",
                code: "CATEGORY_ID_INVALID",
            },
            {
                testCase: "category id is negative",
                id: "-1",
                code: "CATEGORY_ID_INVALID",
            },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryById(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("happy path", () => {
        it("should return category details with isLocked false when no scores exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryById(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryByIdResponse
            expect(json.message).toBe("Category retrieved successfully")
            expect(json.data).toEqual({
                id: category.id,
                name: "Swimwear",
                roundId: round.id,
                roundName: "Preliminary",
                isLocked: false,
            })
        })

        it("should return isLocked true when scores exist for the category", async () => {
            const { round, category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryById(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryByIdResponse
            expect(json.data).toEqual({
                id: category.id,
                name: "Swimwear",
                roundId: round.id,
                roundName: "Preliminary",
                isLocked: true,
            })
        })

        it("should return isLocked false for a category in a later round with no scores", async () => {
            const round = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const category = await seedCategory({ name: "Q&A", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryById(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryByIdResponse
            expect(json.data).toEqual({
                id: category.id,
                name: "Q&A",
                roundId: round.id,
                roundName: "Top 5",
                isLocked: false,
            })
        })
    })

    describe("service failure", () => {
        it("should return CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryById(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CATEGORY_NOT_FOUND")
        })
    })
})
