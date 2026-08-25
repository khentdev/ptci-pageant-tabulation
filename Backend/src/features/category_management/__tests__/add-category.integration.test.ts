import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { AddCategoryResponse } from "../types.js"

describe("Add Category Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Add Category Admin",
        username: "test-add-category-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Add Category Judge",
        username: "test-add-category-judge",
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

    const postAddCategory = async (
        cookieHeader: string,
        csrfToken: string,
        body: Record<string, unknown>,
    ) => {
        return app.request("/categories", {
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

    beforeEach(async () => {
        await prisma.category.deleteMany()
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
        await prisma.category.deleteMany()
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
            const res = await app.request("/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Swimwear",
                    roundId: "1",
                }),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to add a category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: String(round.id),
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should create a category with name and roundId only", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: String(round.id),
            })
            expect(res.status).toBe(201)

            const json = await res.json() as AddCategoryResponse
            expect(json.message).toBe("Category added successfully")

            const category = await prisma.category.findFirst({
                where: { roundId: round.id },
                select: {
                    name: true,
                    roundId: true,
                    _count: {
                        select: {
                            criteriaFields: true,
                        },
                    },
                },
            })
            expect(category).toEqual({
                name: "Swimwear",
                roundId: round.id,
                _count: {
                    criteriaFields: 0,
                },
            })
        })

        it("should trim whitespace from the category name before saving", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "  Talent  ",
                roundId: String(round.id),
            })
            expect(res.status).toBe(201)

            const category = await prisma.category.findFirst({
                where: { roundId: round.id },
                select: { name: true },
            })
            expect(category?.name).toBe("Talent")
        })

        it("should allow multiple categories in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: String(round.id),
            })
            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Talent",
                roundId: String(round.id),
            })
            expect(res.status).toBe(201)

            const categories = await prisma.category.findMany({
                where: { roundId: round.id },
                orderBy: { name: "asc" },
                select: { name: true },
            })
            expect(categories).toEqual([
                { name: "Swimwear" },
                { name: "Talent" },
            ])
        })

        it("should allow categories with the same name in different rounds", async () => {
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topFive = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddCategory(cookieHeader, csrfToken, {
                name: "Q&A",
                roundId: String(preliminary.id),
            })
            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Q&A",
                roundId: String(topFive.id),
            })
            expect(res.status).toBe(201)

            const categories = await prisma.category.findMany({
                where: { name: "Q&A" },
                select: { roundId: true },
                orderBy: { roundId: "asc" },
            })
            expect(categories).toEqual([
                { roundId: preliminary.id },
                { roundId: topFive.id },
            ])
        })

        it("should allow categories with the same name in the same round when they have different ids", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: String(round.id),
            })
            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: String(round.id),
            })
            expect(res.status).toBe(201)

            const categories = await prisma.category.findMany({
                where: {
                    roundId: round.id,
                    name: "Swimwear",
                },
                select: { id: true },
                orderBy: { id: "asc" },
            })
            expect(categories).toHaveLength(2)
            expect(categories[0]!.id).not.toBe(categories[1]!.id)
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "category name is empty",
                body: {
                    name: "",
                    roundId: "1",
                },
                code: "CATEGORY_NAME_REQUIRED",
                field: "add_category_input_name",
            },
            {
                testCase: "category name is whitespace only",
                body: {
                    name: "   ",
                    roundId: "1",
                },
                code: "CATEGORY_NAME_REQUIRED",
                field: "add_category_input_name",
            },
            {
                testCase: "round id is zero",
                body: {
                    name: "Swimwear",
                    roundId: "0",
                },
                code: "CATEGORY_ROUND_ID_INVALID",
                field: "add_category_input_round_id",
            },
            {
                testCase: "round id is negative",
                body: {
                    name: "Swimwear",
                    roundId: "-1",
                },
                code: "CATEGORY_ROUND_ID_INVALID",
                field: "add_category_input_round_id",
            },
            {
                testCase: "round id is not an integer",
                body: {
                    name: "Swimwear",
                    roundId: "1.5",
                },
                code: "CATEGORY_ROUND_ID_INVALID",
                field: "add_category_input_round_id",
            },
            {
                testCase: "round id is not numeric",
                body: {
                    name: "Swimwear",
                    roundId: "abc",
                },
                code: "CATEGORY_ROUND_ID_INVALID",
                field: "add_category_input_round_id",
            },
            {
                testCase: "round id is missing",
                body: {
                    name: "Swimwear",
                },
                code: "CATEGORY_ROUND_ID_REQUIRED",
                field: "add_category_input_round_id",
            },
            {
                testCase: "category name is missing",
                body: {
                    roundId: "1",
                },
                code: "CATEGORY_NAME_REQUIRED",
                field: "add_category_input_name",
            },
        ])("should return $code if $testCase", async ({ body, code, field }) => {
            await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddCategory(cookieHeader, csrfToken, body)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it("should reject a numeric roundId in the JSON body", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: round.id,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_ROUND_ID_REQUIRED")
            expect(json.error.field).toBe("add_category_input_round_id")
        })

        it("should reject a numeric category name in the JSON body", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: 123,
                roundId: String(round.id),
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_NAME_REQUIRED")
            expect(json.error.field).toBe("add_category_input_name")
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: "99999",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })

        it("should not create a category when the round lookup fails", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddCategory(cookieHeader, csrfToken, {
                name: "Swimwear",
                roundId: "99999",
            })

            const categoryCount = await prisma.category.count()
            expect(categoryCount).toBe(0)
        })
    })
})
