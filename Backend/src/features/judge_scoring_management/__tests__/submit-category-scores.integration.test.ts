import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { SubmitCategoryScoresResponse } from "../types.js"

describe("Submit Category Scores Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Submit Scores Admin",
        username: "test-submit-scores-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Submit Scores Judge",
        username: "test-submit-scores-judge",
        role: "JUDGE" as Role,
    }
    const TEST_OTHER_JUDGE = {
        name: "Submit Scores Other Judge",
        username: "test-submit-scores-other-judge",
        role: "JUDGE" as Role,
    }

    const testUsernames = [TEST_ADMIN.username, TEST_JUDGE.username, TEST_OTHER_JUDGE.username]

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

    const postSubmitScores = (
        cookieHeader: string,
        csrfToken: string,
        categoryId: number | string,
        body: Record<string, unknown>,
    ) =>
        app.request(`/judge-scoring/categories/${categoryId}/scores`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify(body),
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
        const judge = await seedUser(TEST_JUDGE)
        const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)
        return { judge, cookieHeader, csrfToken }
    }

    const seedRound = async (data: {
        name: string
        phaseOrder: number
        contestantLimit?: number | null
        winnersDeclaredAt?: Date | null
    }) =>
        prisma.round.create({
            data: {
                name: data.name,
                phaseOrder: data.phaseOrder,
                contestantLimit: data.contestantLimit ?? null,
                winnersDeclaredAt: data.winnersDeclaredAt ?? null,
            },
            select: { id: true, phaseOrder: true },
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

    const seedContestant = async (candidateNumber: number, name: string) =>
        prisma.contestant.create({
            data: {
                candidateNumber,
                name,
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            },
            select: { id: true },
        })

    /** Preliminary round (phaseOrder 1) with one category, two fields, and two contestants. */
    const seedPreliminaryScoringSetup = async () => {
        const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
        const category = await seedCategory({ name: "Swimwear", roundId: round.id })
        const fieldOne = await seedCriteriaField(category.id, "Stage Presence", 40)
        const fieldTwo = await seedCriteriaField(category.id, "Poise", 60)
        const contestantOne = await seedContestant(1, "Contestant A")
        const contestantTwo = await seedContestant(2, "Contestant B")
        return { round, category, fieldOne, fieldTwo, contestantOne, contestantTwo }
    }

    const fullBatch = (
        contestantIds: number[],
        fields: { id: number; value: string }[],
    ) =>
        contestantIds.flatMap((contestantId) =>
            fields.map((field) => ({ contestantId, criteriaFieldId: field.id, value: field.value })),
        )

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
            const res = await app.request("/judge-scoring/categories/1/scores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scores: [] }),
            })
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if an admin attempts to submit scores", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const { category } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, { scores: [] })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should submit a complete batch for the first round and insert one score row per contestant per field", async () => {
            const { judge, cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "38" }, { id: fieldTwo.id, value: "55" }],
                ),
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as SubmitCategoryScoresResponse

            expect(res.status).toBe(201)
            expect(json.message).toBe("Scores submitted successfully.")

            const scores = await prisma.score.findMany({
                where: { judgeId: judge.id, categoryId: category.id },
                orderBy: [{ contestantId: "asc" }, { criteriaFieldId: "asc" }],
                select: { contestantId: true, criteriaFieldId: true, value: true },
            })
            expect(scores.map((score) => Number(score.value))).toEqual([38, 55, 38, 55])
        })

        it("should only require scores for contestants advanced into a later round", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const category = await seedCategory({ name: "Talent", roundId: top5.id })
            const field = await seedCriteriaField(category.id, "Score", 100)
            const advanced = await seedContestant(1, "Advanced Contestant")
            await seedContestant(2, "Not Advanced Contestant")
            await prisma.roundContestant.create({ data: { roundId: top5.id, contestantId: advanced.id } })
            void prelims

            const body = { scores: [{ contestantId: advanced.id, criteriaFieldId: field.id, value: "90" }] }
            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)

            expect(res.status).toBe(201)
        })
    })

    describe("validation", () => {
        it("should return SCORING_CATEGORY_ID_INVALID when the category id param is invalid", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await postSubmitScores(cookieHeader, csrfToken, "abc", { scores: [] })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_CATEGORY_ID_INVALID")
            expect(json.error.field).toBe("submit_category_scores_input_id")
        })

        it("should return SCORING_SCORES_REQUIRED when scores is missing", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {})
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_SCORES_REQUIRED")
        })

        it("should return SCORING_SCORES_REQUIRED when scores is an empty array", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, { scores: [] })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_SCORES_REQUIRED")
        })

        it("should return SCORING_SCORE_ENTRY_INVALID when an entry is missing a contestant id", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ criteriaFieldId: fieldOne.id, value: "10" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_SCORE_ENTRY_INVALID")
        })

        it("should return SCORING_VALUE_INVALID when value is sent as a JSON number", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, contestantOne } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: 10 }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_VALUE_INVALID")
        })

        it("should return SCORING_VALUE_INVALID when value has more than 2 decimal places", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, contestantOne } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: "10.123" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_VALUE_INVALID")
        })

        it("should return SCORING_VALUE_INVALID when value is a negative string", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, contestantOne } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: "-1" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_VALUE_INVALID")
        })

        it("should return SCORING_DUPLICATE_ENTRY when the same contestant and field pair appears twice", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, contestantOne } = await seedPreliminaryScoringSetup()

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [
                    { contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: "10" },
                    { contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: "20" },
                ],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_DUPLICATE_ENTRY")
        })
    })

    describe("business rules", () => {
        it("should return SCORING_CATEGORY_NOT_FOUND when the category does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await postSubmitScores(cookieHeader, csrfToken, 999999, {
                scores: [{ contestantId: 1, criteriaFieldId: 1, value: "10" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("SCORING_CATEGORY_NOT_FOUND")
        })

        it("should return SCORING_CATEGORY_NO_FIELDS when the category has no scoring fields", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Empty Category", roundId: round.id })
            await seedContestant(1, "Contestant A")

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: 1, criteriaFieldId: 1, value: "10" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_CATEGORY_NO_FIELDS")
        })

        it("should return SCORING_ROUND_NO_CONTESTANTS when the round has no eligible contestants", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const category = await seedCategory({ name: "Talent", roundId: top5.id })
            const field = await seedCriteriaField(category.id, "Score", 100)

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: 1, criteriaFieldId: field.id, value: "90" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_ROUND_NO_CONTESTANTS")
        })

        it("should return SCORING_CONTESTANT_NOT_IN_ROUND when a submitted contestant is not eligible", async () => {
            // Phase order 1 treats every contestant as eligible, so this must use a later
            // round scoped by `RoundContestant` to actually exercise the eligibility check.
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const category = await seedCategory({ name: "Talent", roundId: top5.id })
            const field = await seedCriteriaField(category.id, "Score", 100)
            const advanced = await seedContestant(1, "Advanced Contestant")
            const outsider = await seedContestant(2, "Not Advanced Contestant")
            await prisma.roundContestant.create({ data: { roundId: top5.id, contestantId: advanced.id } })

            const body = {
                scores: [
                    { contestantId: advanced.id, criteriaFieldId: field.id, value: "90" },
                    { contestantId: outsider.id, criteriaFieldId: field.id, value: "10" },
                ],
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as { error: { code: string; data: { contestantId: number } } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_CONTESTANT_NOT_IN_ROUND")
            expect(json.error.data.contestantId).toBe(outsider.id)
        })

        it("should return SCORING_FIELD_NOT_IN_CATEGORY when a submitted field belongs to another category", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()
            const otherCategory = await seedCategory({ name: "Formal Wear", roundId: (await seedRound({ name: "Other Round", phaseOrder: 5 })).id })
            const foreignField = await seedCriteriaField(otherCategory.id, "Foreign Field", 50)

            const body = {
                scores: [
                    ...fullBatch(
                        [contestantOne.id, contestantTwo.id],
                        [{ id: fieldOne.id, value: "38" }, { id: fieldTwo.id, value: "55" }],
                    ),
                    { contestantId: contestantOne.id, criteriaFieldId: foreignField.id, value: "10" },
                ],
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as { error: { code: string; data: { criteriaFieldId: number } } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_FIELD_NOT_IN_CATEGORY")
            expect(json.error.data.criteriaFieldId).toBe(foreignField.id)
        })

        it("should return SCORING_SCORES_INCOMPLETE when a contestant-field pair is missing", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: [
                    { contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: "38" },
                    { contestantId: contestantOne.id, criteriaFieldId: fieldTwo.id, value: "55" },
                    { contestantId: contestantTwo.id, criteriaFieldId: fieldOne.id, value: "38" },
                ],
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_SCORES_INCOMPLETE")
        })

        it("should return SCORING_VALUE_OUT_OF_RANGE when a value exceeds the field's max value", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "40.01" }, { id: fieldTwo.id, value: "55" }],
                ),
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as {
                error: { code: string; data: { contestantId: number; criteriaFieldId: number; maxValue: number } }
            }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_VALUE_OUT_OF_RANGE")
            expect(json.error.data.criteriaFieldId).toBe(fieldOne.id)
            expect(json.error.data.maxValue).toBe(40)
        })

        it("should return SCORING_ALREADY_SUBMITTED when scores already exist for this judge and category", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "38" }, { id: fieldTwo.id, value: "55" }],
                ),
            }

            const firstRes = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            expect(firstRes.status).toBe(201)

            const secondRes = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await secondRes.json() as { error: { code: string } }

            expect(secondRes.status).toBe(400)
            expect(json.error.code).toBe("SCORING_ALREADY_SUBMITTED")

            const scoreCount = await prisma.score.count({ where: { categoryId: category.id } })
            expect(scoreCount).toBe(4)
        })

        it("should return SCORING_ROUND_LOCKED when the round's winners have already been declared", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const round = await seedRound({ name: "Finals", phaseOrder: 1, winnersDeclaredAt: new Date() })
            const category = await seedCategory({ name: "Talent", roundId: round.id })
            const field = await seedCriteriaField(category.id, "Score", 100)
            const contestant = await seedContestant(1, "Contestant A")

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: contestant.id, criteriaFieldId: field.id, value: "90" }],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_ROUND_LOCKED")
        })

        it("should return SCORING_ROUND_COMPLETED when a later round has already been populated", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo, round } = await seedPreliminaryScoringSetup()
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            await prisma.roundContestant.create({ data: { roundId: top5.id, contestantId: contestantOne.id } })
            void round

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "38" }, { id: fieldTwo.id, value: "55" }],
                ),
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_ROUND_COMPLETED")
        })
    })

    describe("boundary and whitespace behavior", () => {
        it("should accept a value of exactly 0", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "0" }, { id: fieldTwo.id, value: "0" }],
                ),
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            expect(res.status).toBe(201)
        })

        it("should accept a value equal to the field's max value", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "40" }, { id: fieldTwo.id, value: "60" }],
                ),
            }

            const res = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            expect(res.status).toBe(201)
        })
    })

    describe("non-obvious behavior", () => {
        it("should handle concurrent identical submissions with exactly one success", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "38" }, { id: fieldTwo.id, value: "55" }],
                ),
            }

            const [firstRes, secondRes] = await Promise.all([
                postSubmitScores(cookieHeader, csrfToken, category.id, body),
                postSubmitScores(cookieHeader, csrfToken, category.id, body),
            ])

            const statuses = [firstRes.status, secondRes.status].sort()
            expect(statuses[0]).toBe(201)
            expect(statuses[1]).toBe(400)

            const scoreCount = await prisma.score.count({ where: { categoryId: category.id } })
            expect(scoreCount).toBe(4)
        })

        it("should allow two different judges to submit the same category independently", async () => {
            const otherJudge = await seedUser(TEST_OTHER_JUDGE)
            const { judge, cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { cookieHeader: otherCookieHeader, csrfToken: otherCsrfToken } = await loginAndGetCredentials(TEST_OTHER_JUDGE.username)
            const { category, fieldOne, fieldTwo, contestantOne, contestantTwo } = await seedPreliminaryScoringSetup()

            const body = {
                scores: fullBatch(
                    [contestantOne.id, contestantTwo.id],
                    [{ id: fieldOne.id, value: "38" }, { id: fieldTwo.id, value: "55" }],
                ),
            }

            const firstRes = await postSubmitScores(cookieHeader, csrfToken, category.id, body)
            const secondRes = await postSubmitScores(otherCookieHeader, otherCsrfToken, category.id, body)

            expect(firstRes.status).toBe(201)
            expect(secondRes.status).toBe(201)

            const scoreCount = await prisma.score.count({ where: { categoryId: category.id } })
            expect(scoreCount).toBe(8)

            const judgeScoreCount = await prisma.score.count({ where: { categoryId: category.id, judgeId: judge.id } })
            const otherJudgeScoreCount = await prisma.score.count({ where: { categoryId: category.id, judgeId: otherJudge.id } })
            expect(judgeScoreCount).toBe(4)
            expect(otherJudgeScoreCount).toBe(4)
        })

        it("should not create any score rows when the batch is rejected", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const { category, fieldOne, contestantOne } = await seedPreliminaryScoringSetup()

            await postSubmitScores(cookieHeader, csrfToken, category.id, {
                scores: [{ contestantId: contestantOne.id, criteriaFieldId: fieldOne.id, value: "38" }],
            })

            const scoreCount = await prisma.score.count({ where: { categoryId: category.id } })
            expect(scoreCount).toBe(0)
        })
    })
})
