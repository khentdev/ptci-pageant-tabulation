import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { DeleteCategoryResponse } from "../types.js"

describe("Delete Category Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Delete Category Admin",
        username: "test-delete-category-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Delete Category Judge",
        username: "test-delete-category-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Delete Category Score Judge",
        username: "test-delete-category-score-judge",
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

    const deleteCategory = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/categories/${id}`, {
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

    const seedCriteriaFields = async (categoryId: number, fields: { name: string; maxValue: number }[]) => {
        await prisma.criteriaField.createMany({
            data: fields.map((field) => ({
                categoryId,
                name: field.name,
                maxValue: field.maxValue,
            })),
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

        return { round, category, criteriaField }
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
                method: "DELETE",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to delete a category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await deleteCategory(cookieHeader, csrfToken, category.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")

            const unchangedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { id: true },
            })
            expect(unchangedCategory).not.toBeNull()
        })
    })

    describe("happy path", () => {
        it("should delete a category with no fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, category.id)
            const json = await res.json() as DeleteCategoryResponse

            expect(res.status).toBe(200)
            expect(json.message).toBe("Category deleted successfully")

            const deletedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { id: true },
            })
            expect(deletedCategory).toBeNull()
        })

        it("should delete a category with criteria fields when no scores exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Stage Presence", maxValue: 60 },
                { name: "Poise", maxValue: 40 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, category.id)

            expect(res.status).toBe(200)

            const deletedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { id: true },
            })
            expect(deletedCategory).toBeNull()

            const remainingFields = await prisma.criteriaField.count({
                where: { categoryId: category.id },
            })
            expect(remainingFields).toBe(0)
        })

        it("should not affect sibling categories in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, swimwear.id)
            expect(res.status).toBe(200)

            const siblingCategory = await prisma.category.findUnique({
                where: { id: talent.id },
                select: { id: true, name: true },
            })
            expect(siblingCategory).toEqual({
                id: talent.id,
                name: "Talent",
            })
        })

        it("should not delete the parent round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const unchangedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true, name: true },
            })
            expect(unchangedRound).toEqual({
                id: round.id,
                name: "Preliminary",
            })
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

            const res = await deleteCategory(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string; field?: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe("delete_category_input_id")
        })
    })

    describe("service failure", () => {
        it("should return CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CATEGORY_NOT_FOUND")
        })

        it("should return CATEGORY_NOT_FOUND when deleting the same category twice", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const firstDelete = await deleteCategory(cookieHeader, csrfToken, category.id)
            expect(firstDelete.status).toBe(200)

            const secondDelete = await deleteCategory(cookieHeader, csrfToken, category.id)
            const json = await secondDelete.json() as { error: { code: string } }

            expect(secondDelete.status).toBe(404)
            expect(json.error.code).toBe("CATEGORY_NOT_FOUND")
        })

        it("should return CATEGORY_LOCKED when scores exist for the category", async () => {
            const { category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, category.id)
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_LOCKED")
            expect(json.error.message).toBe("Category cannot be edited because scores already exist for this category.")

            const unchangedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { id: true },
            })
            expect(unchangedCategory).not.toBeNull()
        })

        it("should not remove criteria fields when delete is rejected due to scores", async () => {
            const { category, criteriaField } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await deleteCategory(cookieHeader, csrfToken, category.id)

            const savedFields = await prisma.criteriaField.findMany({
                where: { categoryId: category.id },
                select: { id: true, name: true },
            })
            expect(savedFields).toEqual([
                { id: criteriaField.id, name: "Stage Presence" },
            ])
        })
    })

    describe("edge cases", () => {
        it("should delete one category and leave the other in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, swimwear.id)
            expect(res.status).toBe(200)

            const remainingCategories = await prisma.category.findMany({
                where: { roundId: round.id },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            })
            expect(remainingCategories).toEqual([
                { id: talent.id, name: "Talent" },
            ])
        })

        it("should leave the round intact after deleting its only category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await deleteCategory(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const unchangedRound = await prisma.round.findUnique({
                where: { id: round.id },
                select: { id: true },
            })
            expect(unchangedRound).not.toBeNull()

            const categoryCount = await prisma.category.count({
                where: { roundId: round.id },
            })
            expect(categoryCount).toBe(0)
        })
    })
})
