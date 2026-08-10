import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { EditCategoryResponse } from "../types.js"

describe("Edit Category Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Edit Category Admin",
        username: "test-edit-category-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Edit Category Judge",
        username: "test-edit-category-judge",
        role: "JUDGE" as Role,
    }

    const TEST_SCORE_JUDGE = {
        name: "Edit Category Score Judge",
        username: "test-edit-category-score-judge",
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

    const patchEditCategory = async (
        cookieHeader: string,
        csrfToken: string,
        id: number | string,
        body: Record<string, unknown>,
    ) => {
        return app.request(`/categories/${id}`, {
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
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Talent",
                }),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to edit a category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Talent",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should update the category name", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Talent",
            })
            expect(res.status).toBe(200)

            const json = await res.json() as EditCategoryResponse
            expect(json.message).toBe("Category updated successfully")

            const updatedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: {
                    name: true,
                    roundId: true,
                },
            })
            expect(updatedCategory).toEqual({
                name: "Talent",
                roundId: round.id,
            })
        })

        it("should trim whitespace from the category name before saving", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "  Talent  ",
            })
            expect(res.status).toBe(200)

            const updatedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { name: true },
            })
            expect(updatedCategory?.name).toBe("Talent")
        })

        it("should not change the round assignment when editing a category", async () => {
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topFive = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const category = await seedCategory({ name: "Swimwear", roundId: preliminary.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Talent",
                roundId: String(topFive.id),
            })
            expect(res.status).toBe(200)

            const updatedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: {
                    name: true,
                    roundId: true,
                },
            })
            expect(updatedCategory).toEqual({
                name: "Talent",
                roundId: preliminary.id,
            })
        })

        it("should allow renaming to a name already used in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCategory({ name: "Talent", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, swimwear.id, {
                name: "Talent",
            })
            expect(res.status).toBe(200)

            const categories = await prisma.category.findMany({
                where: {
                    roundId: round.id,
                    name: "Talent",
                },
                select: { id: true },
                orderBy: { id: "asc" },
            })
            expect(categories).toHaveLength(2)
            expect(categories.some((entry) => entry.id === swimwear.id)).toBe(true)
        })

        it("should allow renaming to a name already used in a different round", async () => {
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topFive = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const category = await seedCategory({ name: "Swimwear", roundId: preliminary.id })
            await seedCategory({ name: "Q&A", roundId: topFive.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Q&A",
            })
            expect(res.status).toBe(200)

            const updatedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: {
                    name: true,
                    roundId: true,
                },
            })
            expect(updatedCategory).toEqual({
                name: "Q&A",
                roundId: preliminary.id,
            })
        })

        it("should succeed when submitting the same name", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Swimwear",
            })
            expect(res.status).toBe(200)

            const updatedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { name: true },
            })
            expect(updatedCategory?.name).toBe("Swimwear")
        })

        it("should not affect other categories in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, swimwear.id, {
                name: "Evening Gown",
            })
            expect(res.status).toBe(200)

            const unchangedCategory = await prisma.category.findUnique({
                where: { id: talent.id },
                select: { name: true },
            })
            expect(unchangedCategory?.name).toBe("Talent")
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "category id is not a number",
                id: "abc",
                code: "CATEGORY_ID_INVALID",
                field: "edit_category_input_id",
            },
            {
                testCase: "category id is zero",
                id: "0",
                code: "CATEGORY_ID_INVALID",
                field: "edit_category_input_id",
            },
            {
                testCase: "category id is negative",
                id: "-1",
                code: "CATEGORY_ID_INVALID",
                field: "edit_category_input_id",
            },
            {
                testCase: "category id is not an integer",
                id: "1.5",
                code: "CATEGORY_ID_INVALID",
                field: "edit_category_input_id",
            },
        ])("should return $code if $testCase", async ({ id, code, field }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, id, {
                name: "Talent",
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it.each([
            {
                testCase: "category name is empty",
                body: {
                    name: "",
                },
                code: "CATEGORY_NAME_REQUIRED",
                field: "edit_category_input_name",
            },
            {
                testCase: "category name is whitespace only",
                body: {
                    name: "   ",
                },
                code: "CATEGORY_NAME_REQUIRED",
                field: "edit_category_input_name",
            },
            {
                testCase: "category name is missing",
                body: {},
                code: "CATEGORY_NAME_REQUIRED",
                field: "edit_category_input_name",
            },
        ])("should return $code if $testCase", async ({ body, code, field }) => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it("should reject a numeric category name in the JSON body", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_NAME_REQUIRED")
            expect(json.error.field).toBe("edit_category_input_name")
        })
    })

    describe("service failure", () => {
        it("should return CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, 99999, {
                name: "Talent",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CATEGORY_NOT_FOUND")
        })

        it("should not update any category when the category lookup fails", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await patchEditCategory(cookieHeader, csrfToken, 99999, {
                name: "Talent",
            })

            const unchangedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { name: true },
            })
            expect(unchangedCategory?.name).toBe("Swimwear")
        })

        it("should return CATEGORY_LOCKED when scores exist for the category", async () => {
            const { category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Talent",
            })
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_LOCKED")
            expect(json.error.message).toBe("Category cannot be edited because scores already exist for this category.")
        })

        it("should not update the category name when scores exist", async () => {
            const { category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await patchEditCategory(cookieHeader, csrfToken, category.id, {
                name: "Talent",
            })

            const unchangedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { name: true },
            })
            expect(unchangedCategory?.name).toBe("Swimwear")
        })
    })
})
