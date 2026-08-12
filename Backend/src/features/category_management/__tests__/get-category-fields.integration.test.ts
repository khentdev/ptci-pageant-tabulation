import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetCategoryFieldsResponse } from "../types.js"

describe("Get Category Fields Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Category Fields Admin",
        username: "test-get-category-fields-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Category Fields Judge",
        username: "test-get-category-fields-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Get Category Fields Score Judge",
        username: "test-get-category-fields-score-judge",
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

    const getCategoryFields = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/categories/${id}/fields`, {
            method: "GET",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
        })

    const putSaveCategoryFields = (
        cookieHeader: string,
        csrfToken: string,
        id: number,
        fields: Array<{ name: string; maxValue: string }>,
    ) =>
        app.request(`/categories/${id}/fields`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify({ fields }),
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

    const seedCriteriaFields = async (
        categoryId: number,
        fields: Array<{ name: string; maxValue: number }>,
    ) => {
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
        const stagePresence = await prisma.criteriaField.create({
            data: {
                categoryId: category.id,
                name: "Stage Presence",
                maxValue: 60,
            },
            select: { id: true },
        })
        await prisma.criteriaField.create({
            data: {
                categoryId: category.id,
                name: "Poise",
                maxValue: 40,
            },
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
                criteriaFieldId: stagePresence.id,
                value: 85,
            },
        })

        return { round, category, stagePresence }
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
            const res = await app.request("/categories/1/fields", {
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get category fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return an empty fields array when the category has no criteria fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.message).toBe("Category fields retrieved successfully")
            expect(json.data).toEqual({
                categoryName: "Swimwear",
                isLocked: false,
                fields: [],
            })
        })

        it("should return existing fields with id, name, and maxValue", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Stage Presence", maxValue: 40 },
                { name: "Poise", maxValue: 35 },
                { name: "Confidence", maxValue: 25 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.categoryName).toBe("Swimwear")
            expect(json.data.isLocked).toBe(false)
            expect(json.data.fields).toHaveLength(3)
            expect(json.data.fields.map((field) => field.name)).toEqual([
                "Stage Presence",
                "Poise",
                "Confidence",
            ])
            expect(json.data.fields.every((field) => typeof field.id === "number")).toBe(true)
            expect(json.data.fields.map((field) => field.maxValue)).toEqual([40, 35, 25])
        })

        it("should preserve decimal max values in the response", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Stage Presence", maxValue: 33.33 },
                { name: "Poise", maxValue: 33.33 },
                { name: "Confidence", maxValue: 33.34 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.fields.map((field) => field.maxValue)).toEqual([33.34, 33.33, 33.33])
        })

        it("should return fields ordered by maxValue descending", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Low Weight", maxValue: 10 },
                { name: "High Weight", maxValue: 60 },
                { name: "Mid Weight", maxValue: 30 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.fields.map((field) => field.maxValue)).toEqual([60, 30, 10])
            expect(json.data.fields.map((field) => field.name)).toEqual([
                "High Weight",
                "Mid Weight",
                "Low Weight",
            ])
        })

        it("should return isLocked false when no scores exist for the category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Stage Presence", maxValue: 100 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.isLocked).toBe(false)
        })
    })

    describe("edge cases", () => {
        it("should return 200 with isLocked true when scores exist for the category", async () => {
            const { category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.isLocked).toBe(true)
            expect(json.data.fields).toHaveLength(2)
            expect(json.data.fields.map((field) => field.name)).toEqual(["Stage Presence", "Poise"])
            expect(json.data.fields.map((field) => field.maxValue)).toEqual([60, 40])
        })

        it("should return fields only for the requested category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            await seedCriteriaFields(swimwear.id, [{ name: "Stage Presence", maxValue: 100 }])
            await seedCriteriaFields(talent.id, [{ name: "Performance", maxValue: 100 }])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, swimwear.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.categoryName).toBe("Swimwear")
            expect(json.data.fields).toHaveLength(1)
            expect(json.data.fields[0]!.name).toBe("Stage Presence")
        })

        it("should reflect replaced fields after a successful save", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Old Field", maxValue: 100 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await putSaveCategoryFields(cookieHeader, csrfToken, category.id, [
                { name: "Stage Presence", maxValue: "60" },
                { name: "Poise", maxValue: "40" },
            ])

            const res = await getCategoryFields(cookieHeader, csrfToken, category.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryFieldsResponse
            expect(json.data.fields.map((field) => field.name)).toEqual(["Stage Presence", "Poise"])
            expect(json.data.fields.map((field) => field.maxValue)).toEqual([60, 40])
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "category id is not a number",
                id: "abc",
                code: "CATEGORY_ID_INVALID",
                field: "get_category_fields_input_id",
            },
            {
                testCase: "category id is zero",
                id: "0",
                code: "CATEGORY_ID_INVALID",
                field: "get_category_fields_input_id",
            },
            {
                testCase: "category id is negative",
                id: "-1",
                code: "CATEGORY_ID_INVALID",
                field: "get_category_fields_input_id",
            },
        ])("should return $code if $testCase", async ({ id, code, field }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })
    })

    describe("service failure", () => {
        it("should return CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryFields(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CATEGORY_NOT_FOUND")
        })
    })
})
