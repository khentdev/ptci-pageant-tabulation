import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetRoundResultsResponse } from "../types.js"

describe("Get Round Results Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Round Results Admin",
        username: "test-get-round-results-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Round Results Judge",
        username: "test-get-round-results-judge",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ONE = {
        name: "RR Judge 1",
        username: "test-get-round-results-judge-1",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_TWO = {
        name: "RR Judge 2",
        username: "test-get-round-results-judge-2",
        role: "JUDGE" as Role,
    }

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        TEST_JUDGE_ONE.username,
        TEST_JUDGE_TWO.username,
    ]

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

    const getRoundResults = (cookieHeader: string, csrfToken: string, roundId: number | string) =>
        app.request(`/live-event/round-results/${roundId}/advancement`, {
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
            select: { id: true, name: true },
        })
    }

    const seedAdminCredentials = async () => {
        await seedUser(TEST_ADMIN)
        return loginAndGetCredentials(TEST_ADMIN.username)
    }

    const seedRound = async (data: {
        name: string
        phaseOrder: number
        contestantLimit?: number | null
        winnersDeclaredAt?: Date | null
    }) => {
        return prisma.round.create({
            data: {
                name: data.name,
                phaseOrder: data.phaseOrder,
                contestantLimit: data.contestantLimit ?? null,
                winnersDeclaredAt: data.winnersDeclaredAt ?? null,
            },
            select: { id: true, name: true, phaseOrder: true },
        })
    }

    const seedCategory = async (data: { name: string; roundId: number }) => {
        return prisma.category.create({
            data: { name: data.name, roundId: data.roundId },
            select: { id: true, name: true, roundId: true },
        })
    }

    const seedContestant = async (data: {
        candidateNumber: number
        name: string
        gender?: "MALE" | "FEMALE"
    }) => {
        return prisma.contestant.create({
            data: {
                candidateNumber: data.candidateNumber,
                name: data.name,
                gender: data.gender ?? "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            },
            select: { id: true, candidateNumber: true, name: true },
        })
    }

    const seedCriteriaField = async (categoryId: number, name: string, maxValue: number) => {
        return prisma.criteriaField.create({
            data: { categoryId, name, maxValue },
            select: { id: true },
        })
    }

    const seedScore = async (data: {
        judgeId: number
        categoryId: number
        contestantId: number
        criteriaFieldId: number
        value: number
    }) => {
        await prisma.score.create({ data })
    }

    const seedSingleFieldCategoryScore = async (
        judgeId: number,
        categoryId: number,
        contestantId: number,
        value: number,
        criteriaFieldId?: number,
    ) => {
        const fieldId = criteriaFieldId ?? (await seedCriteriaField(categoryId, "Score", 100)).id
        await seedScore({ judgeId, categoryId, contestantId, criteriaFieldId: fieldId, value })
        return fieldId
    }

    const seedMultiFieldCategoryScore = async (
        judgeId: number,
        categoryId: number,
        contestantId: number,
        values: number[],
    ) => {
        for (const [index, value] of values.entries()) {
            const field = await seedCriteriaField(categoryId, `Field ${index + 1}`, 100 / values.length)
            await seedScore({
                judgeId,
                categoryId,
                contestantId,
                criteriaFieldId: field.id,
                value,
            })
        }
    }

    const seedRoundContestant = async (roundId: number, contestantId: number) => {
        await prisma.roundContestant.create({
            data: { roundId, contestantId },
        })
    }

    const seedPreliminaryWithTop5 = async () => {
        const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
        const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
        return { prelims, top5 }
    }

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({ where: { role: "JUDGE" } })
        await prisma.user.deleteMany({
            where: { username: { in: testUsernames } },
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
            const res = await app.request("/live-event/round-results/1/advancement", { method: "GET" })
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get round results", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getRoundResults(cookieHeader, csrfToken, round.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("validation", () => {
        it.each([
            { testCase: "round id is not a number", id: "abc", code: "ROUND_ID_INVALID" },
            { testCase: "round id is zero", id: "0", code: "ROUND_ID_INVALID" },
            { testCase: "round id is negative", id: "-1", code: "ROUND_ID_INVALID" },
            { testCase: "round id is not an integer", id: "1.5", code: "ROUND_ID_INVALID" },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getRoundResults(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getRoundResults(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })
    })

    describe("rankings", () => {
        it("should return partial rankings when only some judges submitted per category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })

            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 101, name: "Keanna" })

            const swimField = await seedCriteriaField(swimwear.id, "Score", 100)
            const talentField = await seedCriteriaField(talent.id, "Score", 100)

            await seedScore({ judgeId: judgeOne.id, categoryId: swimwear.id, contestantId: contestant.id, criteriaFieldId: swimField.id, value: 90 })
            await seedScore({ judgeId: judgeTwo.id, categoryId: swimwear.id, contestantId: contestant.id, criteriaFieldId: swimField.id, value: 88 })
            await seedScore({ judgeId: judgeOne.id, categoryId: talent.id, contestantId: contestant.id, criteriaFieldId: talentField.id, value: 97 })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            const row = json.data.rankings.find((r) => r.contestant.id === contestant.id)!
            expect(row.categories).toEqual([
                { id: swimwear.id, name: "Swimwear", avgScore: 89 },
                { id: talent.id, name: "Talent", avgScore: 97 },
            ])
            expect(row.overallScore).toBe(93)
            expect(row.rank).toBe(1)
            expect(json.data.allJudgesSubmitted).toBe(false)
        })

        it("should return full rankings when all judges submitted all categories", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })

            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 202, name: "State Two" })

            const swimField = await seedCriteriaField(swimwear.id, "Score", 100)
            const talentField = await seedCriteriaField(talent.id, "Score", 100)

            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({ judgeId: judge.id, categoryId: swimwear.id, contestantId: contestant.id, criteriaFieldId: swimField.id, value: 91 })
                await seedScore({ judgeId: judge.id, categoryId: talent.id, contestantId: contestant.id, criteriaFieldId: talentField.id, value: 97 })
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            const row = json.data.rankings.find((r) => r.contestant.id === contestant.id)!
            expect(row.categories).toEqual([
                { id: swimwear.id, name: "Swimwear", avgScore: 91 },
                { id: talent.id, name: "Talent", avgScore: 97 },
            ])
            expect(row.overallScore).toBe(94)
            expect(json.data.allJudgesSubmitted).toBe(true)
        })

        it("should sum multiple criteria fields per judge before averaging across judges", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 303, name: "Multi Field" })

            await seedMultiFieldCategoryScore(judgeOne.id, swimwear.id, contestant.id, [40, 35])
            await seedMultiFieldCategoryScore(judgeTwo.id, swimwear.id, contestant.id, [40, 35])

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            const row = json.data.rankings.find((r) => r.contestant.id === contestant.id)!
            expect(row.categories[0]!.avgScore).toBe(75)
        })

        it("should sort by overall desc and break ties by candidateNumber asc", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)

            const high = await seedContestant({ candidateNumber: 20, name: "High" })
            const tiedA = await seedContestant({ candidateNumber: 10, name: "Tied A" })
            const tiedB = await seedContestant({ candidateNumber: 30, name: "Tied B" })
            const noScore = await seedContestant({ candidateNumber: 5, name: "No Score" })

            const field = await seedCriteriaField(swimwear.id, "Score", 100)
            await seedScore({ judgeId: judgeOne.id, categoryId: swimwear.id, contestantId: high.id, criteriaFieldId: field.id, value: 95 })
            await seedScore({ judgeId: judgeOne.id, categoryId: swimwear.id, contestantId: tiedA.id, criteriaFieldId: field.id, value: 80 })
            await seedScore({ judgeId: judgeOne.id, categoryId: swimwear.id, contestantId: tiedB.id, criteriaFieldId: field.id, value: 80 })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            const ranked = json.data.rankings.filter((r) => r.overallScore !== null)
            expect(ranked.map((r) => r.contestant.candidateNumber)).toEqual([20, 10, 30])
            expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3])

            const unscored = json.data.rankings.find((r) => r.contestant.id === noScore.id)!
            expect(unscored.overallScore).toBeNull()
            expect(unscored.rank).toBeNull()
        })

        it("should return null scores when no scores exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedContestant({ candidateNumber: 401, name: "Empty" })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.data.rankings[0]!.overallScore).toBeNull()
            expect(json.data.rankings[0]!.categories[0]!.avgScore).toBeNull()
        })

        it("should order category columns by name ascending", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedContestant({ candidateNumber: 410, name: "Column Order" })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.data.rankings[0]!.categories.map((c) => c.name)).toEqual(["Swimwear", "Talent"])
            expect(json.data.rankings[0]!.categories.map((c) => c.id)).toEqual([swimwear.id, talent.id])
        })
    })

    describe("contestant pool", () => {
        it("should include all contestants in prelims regardless of round_contestants", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const c1 = await seedContestant({ candidateNumber: 1, name: "Everyone A" })
            const c2 = await seedContestant({ candidateNumber: 2, name: "Everyone B" })
            await seedRoundContestant(top5.id, c1.id)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.rankings.map((r) => r.contestant.id).sort()).toEqual([c1.id, c2.id].sort())
        })

        it("should include only round_contestants for Top N rounds", async () => {
            const { top5 } = await seedPreliminaryWithTop5()
            const c1 = await seedContestant({ candidateNumber: 11, name: "Advanced A" })
            const c2 = await seedContestant({ candidateNumber: 12, name: "Advanced B" })
            await seedContestant({ candidateNumber: 13, name: "Not Advanced" })
            await seedRoundContestant(top5.id, c1.id)
            await seedRoundContestant(top5.id, c2.id)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top5.id)).json() as GetRoundResultsResponse

            expect(json.data.rankings).toHaveLength(2)
            expect(json.data.rankings.map((r) => r.contestant.id).sort()).toEqual([c1.id, c2.id].sort())
        })

        it("should return empty rankings when Top N round has no contestants", async () => {
            const { top5 } = await seedPreliminaryWithTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top5.id)).json() as GetRoundResultsResponse

            expect(json.data.rankings).toEqual([])
        })
    })

    describe("allJudgesSubmitted", () => {
        it("should be false when judges exist but scoring is incomplete", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 501, name: "Partial" })

            const swimField = await seedCriteriaField(swimwear.id, "Score", 100)
            const talentField = await seedCriteriaField(talent.id, "Score", 100)
            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({ judgeId: judge.id, categoryId: swimwear.id, contestantId: contestant.id, criteriaFieldId: swimField.id, value: 85 })
            }
            await seedScore({ judgeId: judgeOne.id, categoryId: talent.id, contestantId: contestant.id, criteriaFieldId: talentField.id, value: 90 })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.data.allJudgesSubmitted).toBe(false)
        })

        it("should be false when zero judges exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.data.allJudgesSubmitted).toBe(false)
        })

        it("should be true when every judge submitted every category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 601, name: "Complete" })

            for (const category of [swimwear, talent]) {
                const field = await seedCriteriaField(category.id, "Score", 100)
                for (const judge of [judgeOne, judgeTwo]) {
                    await seedScore({ judgeId: judge.id, categoryId: category.id, contestantId: contestant.id, criteriaFieldId: field.id, value: 85 })
                }
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.data.allJudgesSubmitted).toBe(true)
        })

        it("should be true when the round has zero categories but judges exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedUser(TEST_JUDGE_ONE)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.data.allJudgesSubmitted).toBe(true)
        })
    })

    describe("isCompleted and nextRound", () => {
        it("should return isCompleted false when next round has no contestants", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            await seedCategory({ name: "Swimwear", roundId: top5.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.isCompleted).toBe(false)
            expect(json.data.nextRound).toEqual({
                id: top5.id,
                name: "Top 5",
                contestantLimit: 5,
                categoryCount: 1,
            })
        })

        it("should return isCompleted true when next round has contestants", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const contestant = await seedContestant({ candidateNumber: 701, name: "Advanced" })
            await seedRoundContestant(top5.id, contestant.id)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.isCompleted).toBe(true)
            expect(json.data.canAdvanceReason).toBe("ROUND_COMPLETED")
        })

        it("should return nextRound null on the final round", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse

            expect(json.data.nextRound).toBeNull()
            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBeNull()
        })

        it("should find next round when phaseOrder has a gap (e.g. 1 → 3)", async () => {
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 3, contestantLimit: 5 })
            await seedCategory({ name: "Swimwear", roundId: top5.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.isCompleted).toBe(false)
            expect(json.data.nextRound).toEqual({
                id: top5.id,
                name: "Top 5",
                contestantLimit: 5,
                categoryCount: 1,
            })
        })

        it("should treat highest phaseOrder as final round even with gaps", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse

            expect(json.data.nextRound).toBeNull()
            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBeNull()
        })
    })

    describe("canAdvance", () => {
        const seedReadyToAdvance = async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 801, name: "Ready" })
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 90)
            return { prelims, top5, judge, contestant }
        }

        it("should return canAdvance true when all gates pass", async () => {
            const { prelims } = await seedReadyToAdvance()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.canAdvance).toBe(true)
            expect(json.data.canAdvanceReason).toBeNull()
        })

        it("should return CURRENT_ROUND_NO_CATEGORIES when current round has no categories", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            await seedUser(TEST_JUDGE_ONE)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBe("CURRENT_ROUND_NO_CATEGORIES")
        })

        it("should return JUDGES_NOT_COMPLETE when judges have not finished", async () => {
            const { prelims } = await seedReadyToAdvance()
            await seedCategory({ name: "Talent", roundId: prelims.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBe("JUDGES_NOT_COMPLETE")
        })

        it("should return ROUND_COMPLETED when next round already has contestants", async () => {
            const { prelims, top5 } = await seedReadyToAdvance()
            const advanced = await seedContestant({ candidateNumber: 802, name: "Already There" })
            await seedRoundContestant(top5.id, advanced.id)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.isCompleted).toBe(true)
            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBe("ROUND_COMPLETED")
        })

        it("should return NEXT_ROUND_NO_CATEGORIES when next round has no categories", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 804, name: "No Next Cats" })
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 90)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.nextRound!.id).toBe(top5.id)
            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBe("NEXT_ROUND_NO_CATEGORIES")
        })

        it("should return NEXT_ROUND_NO_CATEGORIES when next round has null contestantLimit", async () => {
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedRound({ name: "Unlimited Next", phaseOrder: 2, contestantLimit: null })
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: (await prisma.round.findFirst({ where: { phaseOrder: 2 } }))!.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 803, name: "Limit Null" })
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 90)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.canAdvance).toBe(false)
            expect(json.data.canAdvanceReason).toBe("NEXT_ROUND_NO_CATEGORIES")
        })
    })

    describe("advancement", () => {
        const seedSevenContestantPrelims = async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const scores = [93, 89.75, 85.75, 82.75, 80.75, 80.75, 80.75]
            const contestants = []
            for (const [index, overall] of scores.entries()) {
                const contestant = await seedContestant({ candidateNumber: 900 + index, name: `Contestant ${index + 1}` })
                contestants.push(contestant)
                const field = await seedCriteriaField(category.id, "Score", 100)
                for (const judge of [judgeOne, judgeTwo]) {
                    await seedScore({
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: field.id,
                        value: overall,
                    })
                }
            }

            return { prelims, top5, contestants, judgeOne, judgeTwo, category }
        }

        it("should return empty advancement while judges are still scoring", async () => {
            const { prelims, category } = await seedSevenContestantPrelims()
            await seedCategory({ name: "Talent", roundId: prelims.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.advancement).toEqual({
                hasTie: false,
                requiredSelections: 0,
                included: [],
                tied: [],
            })
        })

        it("should return empty advancement when round is completed", async () => {
            const { prelims, top5, contestants } = await seedSevenContestantPrelims()
            await seedRoundContestant(top5.id, contestants[0]!.id)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.isCompleted).toBe(true)
            expect(json.data.advancement.included).toEqual([])
            expect(json.data.advancement.hasTie).toBe(false)
        })

        it("should return included top N with no tie when rankings are clear", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const scores = [95, 90, 85, 80, 75, 74, 73]
            const contestants = []
            for (const [index, overall] of scores.entries()) {
                const contestant = await seedContestant({ candidateNumber: 910 + index, name: `Clear ${index}` })
                contestants.push(contestant)
                const field = await seedCriteriaField(category.id, "Score", 100)
                for (const judge of [judgeOne, judgeTwo]) {
                    await seedScore({
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: field.id,
                        value: overall,
                    })
                }
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.advancement.hasTie).toBe(false)
            expect(json.data.advancement.included).toHaveLength(5)
            expect(json.data.advancement.included.map((c) => c.id)).toEqual(
                contestants.slice(0, 5).map((c) => c.id),
            )
            expect(json.data.advancement.tied).toEqual([])
        })

        it("should return tie at cutoff per wireframe State 2b", async () => {
            const { prelims, contestants } = await seedSevenContestantPrelims()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.advancement.hasTie).toBe(true)
            expect(json.data.advancement.requiredSelections).toBe(1)
            expect(json.data.advancement.included).toHaveLength(4)
            expect(json.data.advancement.included.map((c) => c.id)).toEqual(
                contestants.slice(0, 4).map((c) => c.id),
            )
            expect(json.data.advancement.tied).toHaveLength(3)
            expect(json.data.advancement.tied.map((c) => c.id)).toEqual(
                contestants.slice(4, 7).map((c) => c.id),
            )
            expect(json.data.advancement.tied.every((c) => c.overallScore === 80.75)).toBe(true)
        })

        it("should not flag tie when tied contestants are entirely below cutoff", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            const judge = await seedUser(TEST_JUDGE_ONE)

            const scores = [95, 90, 85, 80, 75, 74, 73]
            for (const [index, overall] of scores.entries()) {
                const contestant = await seedContestant({ candidateNumber: 1000 + index, name: `Below Tie ${index}` })
                const field = await seedCriteriaField(category.id, "Score", 100)
                await seedScore({ judgeId: judge.id, categoryId: category.id, contestantId: contestant.id, criteriaFieldId: field.id, value: overall })
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.advancement.hasTie).toBe(false)
            expect(json.data.advancement.included).toHaveLength(5)
        })

        it("should treat overall scores tied at 2 decimal places for cutoff", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const scores = [
                { name: "Rank 1", candidateNumber: 1101, value: 95 },
                { name: "Rank 2", candidateNumber: 1102, value: 90 },
                { name: "Rank 3", candidateNumber: 1103, value: 85 },
                { name: "Rank 4", candidateNumber: 1104, value: 82 },
                { name: "Tied A", candidateNumber: 1105, value: 80.754 },
                { name: "Tied B", candidateNumber: 1106, value: 80.749 },
            ]

            const contestants = []
            const field = await seedCriteriaField(category.id, "Score", 100)
            for (const entry of scores) {
                const contestant = await seedContestant({ candidateNumber: entry.candidateNumber, name: entry.name })
                contestants.push(contestant)
                for (const judge of [judgeOne, judgeTwo]) {
                    await seedScore({
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: field.id,
                        value: entry.value,
                    })
                }
            }

            const tiedA = contestants[4]!
            const tiedB = contestants[5]!

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, prelims.id)).json() as GetRoundResultsResponse

            expect(json.data.advancement.hasTie).toBe(true)
            expect(json.data.advancement.requiredSelections).toBe(1)
            expect(json.data.advancement.tied.map((c) => c.id).sort()).toEqual([tiedA.id, tiedB.id].sort())
            expect(json.data.advancement.tied[0]!.overallScore).toBe(80.75)
        })
    })

    describe("declare winners", () => {
        it("should return canDeclareWinners true on final round when ready", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 1301, name: "Finalist" })
            await seedRoundContestant(top3.id, contestant.id)
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 92)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse

            expect(json.data.canDeclareWinners).toBe(true)
            expect(json.data.winnersDeclaredAt).toBeNull()
        })

        it("should return canDeclareWinners false when winners already declared", async () => {
            const declaredAt = new Date("2026-08-21T10:00:00.000Z")
            const top3 = await seedRound({
                name: "Top 3",
                phaseOrder: 3,
                contestantLimit: 3,
                winnersDeclaredAt: declaredAt,
            })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 1302, name: "Declared" })
            await seedRoundContestant(top3.id, contestant.id)
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 92)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse

            expect(json.data.canDeclareWinners).toBe(false)
            expect(json.data.winnersDeclaredAt).toBe(declaredAt.toISOString())
        })

        it("should return canDeclareWinners false when final round has cutoff tie", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const scores = [95, 90, 85, 85, 80]
            for (const [index, overall] of scores.entries()) {
                const contestant = await seedContestant({ candidateNumber: 1400 + index, name: `Final ${index}` })
                await seedRoundContestant(top3.id, contestant.id)
                const field = await seedCriteriaField(category.id, "Score", 100)
                for (const judge of [judgeOne, judgeTwo]) {
                    await seedScore({ judgeId: judge.id, categoryId: category.id, contestantId: contestant.id, criteriaFieldId: field.id, value: overall })
                }
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse

            expect(json.data.advancement.hasTie).toBe(true)
            expect(json.data.canDeclareWinners).toBe(false)
        })
    })

    describe("edge cases", () => {
        it("should return rows with null scores for Top N contestants before judging starts", async () => {
            const { top5 } = await seedPreliminaryWithTop5()
            const contestant = await seedContestant({ candidateNumber: 1501, name: "Waiting" })
            await seedRoundContestant(top5.id, contestant.id)
            await seedCategory({ name: "Swimwear", roundId: top5.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, top5.id)).json() as GetRoundResultsResponse

            expect(json.data.rankings).toHaveLength(1)
            expect(json.data.rankings[0]!.overallScore).toBeNull()
        })

        it("should not expose sensitive user fields in the response", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const text = await (await getRoundResults(cookieHeader, csrfToken, round.id)).text()

            expect(text).not.toContain("hashedPassword")
            expect(text).not.toContain("password")
        })

        it("should scope scores to the requested round only", async () => {
            const roundA = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const roundB = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const categoryA = await seedCategory({ name: "Swimwear", roundId: roundA.id })
            const categoryB = await seedCategory({ name: "Talent", roundId: roundB.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestantA = await seedContestant({ candidateNumber: 1601, name: "Round A" })
            const contestantB = await seedContestant({ candidateNumber: 1602, name: "Round B" })
            await seedRoundContestant(roundB.id, contestantB.id)

            await seedSingleFieldCategoryScore(judge.id, categoryA.id, contestantA.id, 90)
            await seedSingleFieldCategoryScore(judge.id, categoryB.id, contestantB.id, 50)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const jsonA = await (await getRoundResults(cookieHeader, csrfToken, roundA.id)).json() as GetRoundResultsResponse
            const jsonB = await (await getRoundResults(cookieHeader, csrfToken, roundB.id)).json() as GetRoundResultsResponse

            const rowA = jsonA.data.rankings.find((r) => r.contestant.id === contestantA.id)!
            const rowB = jsonB.data.rankings.find((r) => r.contestant.id === contestantB.id)!
            expect(rowA.overallScore).toBe(90)
            expect(rowB.overallScore).toBe(50)
            expect(jsonB.data.rankings.find((r) => r.contestant.id === contestantA.id)).toBeUndefined()
        })

        it("should return success message", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const json = await (await getRoundResults(cookieHeader, csrfToken, round.id)).json() as GetRoundResultsResponse

            expect(json.message).toBe("Round results fetched successfully")
        })
    })
})
