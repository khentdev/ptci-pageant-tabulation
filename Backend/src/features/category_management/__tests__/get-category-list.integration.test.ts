import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetCategoryListResponse } from "../types.js"

describe("Get Category List Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Category List Admin",
        username: "test-get-category-list-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Category List Judge",
        username: "test-get-category-list-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Get Category List Score Judge",
        username: "test-get-category-list-score-judge",
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

    const getCategoryList = (cookieHeader: string, csrfToken: string) =>
        app.request("/categories", {
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

    const seedCriteriaFields = async (
        categoryId: number,
        fields: Array<{ name: string; maxValue: number }>,
    ) => {
        return prisma.criteriaField.createManyAndReturn({
            data: fields.map((field) => ({
                categoryId,
                name: field.name,
                maxValue: field.maxValue,
            })),
            select: {
                id: true,
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
            const res = await app.request("/categories", {
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get the category list", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getCategoryList(cookieHeader, csrfToken)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return an empty list when no rounds exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.message).toBe("Category list retrieved successfully")
            expect(json.data).toEqual([])
        })

        it("should return rounds with empty categories when no categories exist", async () => {
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topFive = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data).toEqual([
                {
                    id: preliminary.id,
                    name: "Preliminary",
                    phaseOrder: 1,
                    categories: [],
                },
                {
                    id: topFive.id,
                    name: "Top 5",
                    phaseOrder: 2,
                    categories: [],
                },
            ])
        })

        it("should return rounds ordered by phase order ascending regardless of insertion order", async () => {
            const final = await seedRound({ name: "Final", phaseOrder: 10, contestantLimit: 3 })
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topTen = await seedRound({ name: "Top 10", phaseOrder: 5, contestantLimit: 10 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data.map((round) => round.id)).toEqual([
                preliminary.id,
                topTen.id,
                final.id,
            ])
            expect(json.data).toEqual([
                expect.objectContaining({ phaseOrder: 1 }),
                expect.objectContaining({ phaseOrder: 5 }),
                expect.objectContaining({ phaseOrder: 10 }),
            ])
        })

        it("should return categories grouped by round and ordered by name ascending", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const eveningGown = await seedCategory({ name: "Evening Gown", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data).toHaveLength(1)
            expect(json.data[0]!.categories.map((category) => category.id)).toEqual([
                eveningGown.id,
                swimwear.id,
                talent.id,
            ])
            expect(json.data[0]!.categories.map((category) => category.name)).toEqual([
                "Evening Gown",
                "Swimwear",
                "Talent",
            ])
        })

        it("should return fieldCount and totalScore for categories with criteria fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Stage Presence", maxValue: 40 },
                { name: "Poise", maxValue: 60 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data[0]!.categories).toEqual([
                {
                    id: category.id,
                    name: "Swimwear",
                    fieldCount: 2,
                    totalScore: 100,
                    isLocked: false,
                },
            ])
        })

        it("should return isLocked false when no scores exist for the category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data[0]!.categories[0]).toEqual({
                id: category.id,
                name: "Swimwear",
                fieldCount: 0,
                totalScore: 0,
                isLocked: false,
            })
        })

        it("should return isLocked true when scores exist for the category", async () => {
            const { round, category } = await seedCategoryWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data).toEqual([
                {
                    id: round.id,
                    name: "Preliminary",
                    phaseOrder: 1,
                    categories: [
                        {
                            id: category.id,
                            name: "Swimwear",
                            fieldCount: 1,
                            totalScore: 100,
                            isLocked: true,
                        },
                    ],
                },
            ])
        })
    })

    describe("edge cases", () => {
        it("should allow the same category name in different rounds", async () => {
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topFive = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const preliminaryQa = await seedCategory({ name: "Q&A", roundId: preliminary.id })
            const topFiveQa = await seedCategory({ name: "Q&A", roundId: topFive.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data[0]!.categories).toEqual([
                {
                    id: preliminaryQa.id,
                    name: "Q&A",
                    fieldCount: 0,
                    totalScore: 0,
                    isLocked: false,
                },
            ])
            expect(json.data[1]!.categories).toEqual([
                {
                    id: topFiveQa.id,
                    name: "Q&A",
                    fieldCount: 0,
                    totalScore: 0,
                    isLocked: false,
                },
            ])
        })

        it("should return fieldCount 0 and totalScore 0 for categories without criteria fields", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const withFields = await seedCategory({ name: "Swimwear", roundId: round.id })
            const withoutFields = await seedCategory({ name: "Talent", roundId: round.id })
            await seedCriteriaFields(withFields.id, [
                { name: "Stage Presence", maxValue: 100 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            const talentCategory = json.data[0]!.categories.find((category) => category.id === withoutFields.id)
            expect(talentCategory).toEqual({
                id: withoutFields.id,
                name: "Talent",
                fieldCount: 0,
                totalScore: 0,
                isLocked: false,
            })
        })

        it("should only lock the category that has scores, not sibling categories in the same round", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const criteriaField = await prisma.criteriaField.create({
                data: {
                    categoryId: swimwear.id,
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
                    categoryId: swimwear.id,
                    criteriaFieldId: criteriaField.id,
                    value: 85,
                },
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            const swimwearResult = json.data[0]!.categories.find((category) => category.id === swimwear.id)
            const talentResult = json.data[0]!.categories.find((category) => category.id === talent.id)

            expect(swimwearResult?.isLocked).toBe(true)
            expect(talentResult?.isLocked).toBe(false)
        })

        it("should sum decimal max values correctly for totalScore", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedCriteriaFields(category.id, [
                { name: "Stage Presence", maxValue: 33.33 },
                { name: "Poise", maxValue: 33.33 },
                { name: "Confidence", maxValue: 33.34 },
            ])
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data[0]!.categories[0]!.totalScore).toBe(100)
        })

        it("should include categories only under their assigned round", async () => {
            const preliminary = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const topFive = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: preliminary.id })
            const qa = await seedCategory({ name: "Q&A", roundId: topFive.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getCategoryList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetCategoryListResponse
            expect(json.data[0]!.categories.map((category) => category.id)).toEqual([swimwear.id])
            expect(json.data[1]!.categories.map((category) => category.id)).toEqual([qa.id])
        })
    })
})
