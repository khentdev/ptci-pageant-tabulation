import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { SaveCategoryFieldsResponse } from "../types.js"

describe("Save Category Fields Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Save Category Fields Admin",
        username: "test-save-category-fields-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Save Category Fields Judge",
        username: "test-save-category-fields-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Save Category Fields Score Judge",
        username: "test-save-category-fields-score-judge",
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

    const putSaveCategoryFields = async (
        cookieHeader: string,
        csrfToken: string,
        id: number | string,
        body: Record<string, unknown>,
    ) => {
        return app.request(`/categories/${id}/fields`, {
            method: "PUT",
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

    const getCategoryFieldsFromDb = async (categoryId: number) => {
        return prisma.criteriaField.findMany({
            where: { categoryId },
            orderBy: { name: "asc" },
            select: {
                name: true,
                maxValue: true,
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

        return { round, category, criteriaField }
    }

    const validFieldsBody = (fields: Array<{ name: string; maxValue: string }>) => ({
        fields,
    })

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
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(validFieldsBody([
                    { name: "Stage Presence", maxValue: "100" },
                ])),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to save category fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "100" },
            ]))
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should save fields on a category with no existing fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "40" },
                { name: "Poise", maxValue: "35" },
                { name: "Confidence", maxValue: "25" },
            ]))
            expect(res.status).toBe(200)

            const json = await res.json() as SaveCategoryFieldsResponse
            expect(json.message).toBe("Category fields saved successfully")

            const savedFields = await getCategoryFieldsFromDb(category.id)
            expect(savedFields).toEqual([
                { name: "Confidence", maxValue: expect.any(Object) },
                { name: "Poise", maxValue: expect.any(Object) },
                { name: "Stage Presence", maxValue: expect.any(Object) },
            ])
            expect(savedFields.map((field) => Number(field.maxValue))).toEqual([25, 35, 40])
        })

        it("should replace existing fields with a new batch", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Old Field A", maxValue: 50 },
                { name: "Old Field B", maxValue: 50 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "60" },
                { name: "Poise", maxValue: "40" },
            ]))
            expect(res.status).toBe(200)

            const savedFields = await getCategoryFieldsFromDb(category.id)
            expect(savedFields).toHaveLength(2)
            expect(savedFields.map((field) => field.name)).toEqual(["Poise", "Stage Presence"])
            expect(savedFields.some((field) => field.name.startsWith("Old Field"))).toBe(false)
        })

        it("should trim whitespace from field names before saving", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "  Stage Presence  ", maxValue: "100" },
            ]))
            expect(res.status).toBe(200)

            const savedFields = await getCategoryFieldsFromDb(category.id)
            expect(savedFields).toEqual([
                { name: "Stage Presence", maxValue: expect.any(Object) },
            ])
        })

        it("should accept decimal max values that total exactly 100", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "33.33" },
                { name: "Poise", maxValue: "33.33" },
                { name: "Confidence", maxValue: "33.34" },
            ]))
            expect(res.status).toBe(200)

            const savedFields = await getCategoryFieldsFromDb(category.id)
            const total = savedFields.reduce((sum, field) => sum + Number(field.maxValue), 0)
            expect(total).toBe(100)
        })

        it("should allow a single field with max value 100", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Overall Impact", maxValue: "100" },
            ]))
            expect(res.status).toBe(200)

            const savedFields = await getCategoryFieldsFromDb(category.id)
            expect(savedFields).toHaveLength(1)
            expect(Number(savedFields[0]!.maxValue)).toBe(100)
        })

        it("should not change the category name when saving fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "100" },
            ]))

            const unchangedCategory = await prisma.category.findUnique({
                where: { id: category.id },
                select: { name: true, roundId: true },
            })
            expect(unchangedCategory).toEqual({
                name: "Swimwear",
                roundId: round.id,
            })
        })

        it("should not affect fields on other categories in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            await seedCriteriaFields(talent.id, [
                { name: "Original Talent Field", maxValue: 100 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await putSaveCategoryFields(cookieHeader, csrfToken, swimwear.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "100" },
            ]))

            const talentFields = await getCategoryFieldsFromDb(talent.id)
            expect(talentFields).toEqual([
                { name: "Original Talent Field", maxValue: expect.any(Object) },
            ])
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "category id is not a number",
                id: "abc",
                code: "CATEGORY_ID_INVALID",
                field: "save_category_fields_input_id",
            },
            {
                testCase: "category id is zero",
                id: "0",
                code: "CATEGORY_ID_INVALID",
                field: "save_category_fields_input_id",
            },
            {
                testCase: "category id is negative",
                id: "-1",
                code: "CATEGORY_ID_INVALID",
                field: "save_category_fields_input_id",
            },
        ])("should return $code if $testCase", async ({ id, code, field }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, id, validFieldsBody([
                { name: "Stage Presence", maxValue: "100" },
            ]))
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it("should return CATEGORY_FIELDS_REQUIRED when fields is an empty array", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, { fields: [] })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELDS_REQUIRED")
            expect(json.error.field).toBe("save_category_fields_input_fields")
        })

        it("should return CATEGORY_FIELDS_REQUIRED when fields is missing", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, {})
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELDS_REQUIRED")
            expect(json.error.field).toBe("save_category_fields_input_fields")
        })

        it.each([
            {
                testCase: "field name is empty",
                fields: [{ name: "", maxValue: "100" }],
                code: "CATEGORY_FIELD_NAME_REQUIRED",
                field: "save_category_fields_input_fields_0_name",
            },
            {
                testCase: "field name is whitespace only",
                fields: [{ name: "   ", maxValue: "100" }],
                code: "CATEGORY_FIELD_NAME_REQUIRED",
                field: "save_category_fields_input_fields_0_name",
            },
            {
                testCase: "field name is missing",
                fields: [{ maxValue: "100" }],
                code: "CATEGORY_FIELD_NAME_REQUIRED",
                field: "save_category_fields_input_fields_0_name",
            },
        ])("should return $code if $testCase", async ({ fields, code, field }) => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, { fields })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it.each([
            {
                testCase: "max value is empty",
                fields: [{ name: "Stage Presence", maxValue: "" }],
                code: "CATEGORY_FIELD_MAX_VALUE_REQUIRED",
                field: "save_category_fields_input_fields_0_max_value",
            },
            {
                testCase: "max value is whitespace only",
                fields: [{ name: "Stage Presence", maxValue: "   " }],
                code: "CATEGORY_FIELD_MAX_VALUE_REQUIRED",
                field: "save_category_fields_input_fields_0_max_value",
            },
            {
                testCase: "max value is missing",
                fields: [{ name: "Stage Presence" }],
                code: "CATEGORY_FIELD_MAX_VALUE_REQUIRED",
                field: "save_category_fields_input_fields_0_max_value",
            },
        ])("should return $code if $testCase", async ({ fields, code, field }) => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, { fields })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it.each([
            {
                testCase: "max value is zero",
                maxValue: "0",
            },
            {
                testCase: "max value is negative",
                maxValue: "-10",
            },
            {
                testCase: "max value is not numeric",
                maxValue: "abc",
            },
            {
                testCase: "max value has more than 2 decimal places",
                maxValue: "10.123",
            },
            {
                testCase: "max value is below minimum of 1",
                maxValue: "0.5",
            },
        ])("should return CATEGORY_FIELD_MAX_VALUE_INVALID if $testCase", async ({ maxValue }) => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue },
            ]))
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELD_MAX_VALUE_INVALID")
            expect(json.error.field).toBe("save_category_fields_input_fields_0_max_value")
        })

        it.each([
            {
                testCase: "total is less than 100",
                fields: [
                    { name: "Stage Presence", maxValue: "40" },
                    { name: "Poise", maxValue: "30" },
                ],
            },
            {
                testCase: "total is greater than 100",
                fields: [
                    { name: "Stage Presence", maxValue: "60" },
                    { name: "Poise", maxValue: "50" },
                ],
            },
        ])("should return CATEGORY_FIELDS_TOTAL_INVALID if $testCase", async ({ fields }) => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody(fields))
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELDS_TOTAL_INVALID")
        })

        it("should reject a numeric max value in the JSON body", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, {
                fields: [{ name: "Stage Presence", maxValue: 100 }],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELD_MAX_VALUE_REQUIRED")
            expect(json.error.field).toBe("save_category_fields_input_fields_0_max_value")
        })

        it("should reject a numeric field name in the JSON body", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, {
                fields: [{ name: 123, maxValue: "100" }],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELD_NAME_REQUIRED")
            expect(json.error.field).toBe("save_category_fields_input_fields_0_name")
        })

        it("should report the failing row index for invalid max values in later rows", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "50" },
                { name: "Poise", maxValue: "abc" },
            ]))
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_FIELD_MAX_VALUE_INVALID")
            expect(json.error.field).toBe("save_category_fields_input_fields_1_max_value")
        })
    })

    describe("service failure", () => {
        it("should return CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, 99999, validFieldsBody([
                { name: "Stage Presence", maxValue: "100" },
            ]))
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CATEGORY_NOT_FOUND")
        })

        it("should not create fields when the category lookup fails", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await putSaveCategoryFields(cookieHeader, csrfToken, 99999, validFieldsBody([
                { name: "Stage Presence", maxValue: "100" },
            ]))

            const fieldCount = await prisma.criteriaField.count()
            expect(fieldCount).toBe(0)
        })

        it("should return CATEGORY_LOCKED when scores exist for the category", async () => {
            const { category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "60" },
                { name: "Poise", maxValue: "40" },
            ]))
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CATEGORY_LOCKED")
            expect(json.error.message).toBe("Category cannot be edited because scores already exist for this category.")
        })

        it("should not replace fields when scores exist for the category", async () => {
            const { category, criteriaField } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await putSaveCategoryFields(cookieHeader, csrfToken, category.id, validFieldsBody([
                { name: "Stage Presence", maxValue: "60" },
                { name: "Poise", maxValue: "40" },
            ]))

            const savedFields = await prisma.criteriaField.findMany({
                where: { categoryId: category.id },
                select: { id: true, name: true },
            })
            expect(savedFields).toEqual([
                { id: criteriaField.id, name: "Stage Presence" },
            ])
        })
    })
})
