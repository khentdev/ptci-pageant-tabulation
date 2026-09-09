import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { DeclareWinnersResponse, GetRoundResultsResponse } from "../types.js"

describe("Declare Winners Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Declare Winners Admin",
        username: "test-declare-winners-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Declare Winners Judge",
        username: "test-declare-winners-judge",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ONE = {
        name: "DW Judge 1",
        username: "test-declare-winners-judge-1",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_TWO = {
        name: "DW Judge 2",
        username: "test-declare-winners-judge-2",
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

    const postDeclareWinners = (
        cookieHeader: string,
        csrfToken: string,
        roundId: number | string,
        body?: Record<string, unknown>,
    ) => {
        const headers: Record<string, string> = {
            "Cookie": cookieHeader,
            "X-CSRF-Token": csrfToken,
            "X-Fingerprint": deviceFingerprint,
        }

        if (body !== undefined) {
            headers["Content-Type"] = "application/json"
        }

        return app.request(`/live-event/round-results/${roundId}/declare-winners`, {
            method: "POST",
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
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
    ) => {
        const fieldId = (await seedCriteriaField(categoryId, "Score", 100)).id
        await seedScore({ judgeId, categoryId, contestantId, criteriaFieldId: fieldId, value })
        return fieldId
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

    const seedFinalRoundReady = async () => {
        const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
        const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)
        const contestant = await seedContestant({ candidateNumber: 3001, name: "Finalist" })
        await seedRoundContestant(top3.id, contestant.id)
        const field = await seedCriteriaField(category.id, "Score", 100)
        for (const judge of [judgeOne, judgeTwo]) {
            await seedScore({
                judgeId: judge.id,
                categoryId: category.id,
                contestantId: contestant.id,
                criteriaFieldId: field.id,
                value: 92,
            })
        }
        return { top3, category, judgeOne, judgeTwo, contestant }
    }

    const seedFinalRoundTieAtCutoff = async () => {
        const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
        const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)

        const scores = [95, 90, 85, 85, 80]
        const contestants = []
        for (const [index, overall] of scores.entries()) {
            const contestant = await seedContestant({ candidateNumber: 3100 + index, name: `Final ${index}` })
            await seedRoundContestant(top3.id, contestant.id)
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
            contestants.push(contestant)
        }

        return { top3, category, judgeOne, judgeTwo, contestants }
    }

    const seedFinalRoundPlacementTie = async () => {
        const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
        const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)

        // Exactly 3 contestants in a "Top 3" round (eligible.length === limit) —
        // all auto-included, no cutoff tie. The first two share an identical
        // overall score, producing a placement tie for 1st/2nd.
        const scores = [100, 100, 90]
        const contestants = []
        for (const [index, overall] of scores.entries()) {
            const contestant = await seedContestant({ candidateNumber: 3300 + index, name: `Placement ${index}` })
            await seedRoundContestant(top3.id, contestant.id)
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
            contestants.push(contestant)
        }

        return { top3, category, judgeOne, judgeTwo, contestants }
    }

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.roundWinner.deleteMany()
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
            const res = await app.request("/live-event/round-results/1/declare-winners", { method: "POST" })
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to declare winners", async () => {
            const { top3 } = await seedFinalRoundReady()
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id)
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
            const res = await postDeclareWinners(cookieHeader, csrfToken, id, {})
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })

        it("should return SELECTED_CONTESTANT_IDS_INVALID when selectedContestantIds is not an array", async () => {
            const { top3 } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: "not-an-array",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_INVALID")
        })

        it("should return PLACEMENT_ORDER_INVALID when placementOrder is not an array", async () => {
            const { top3 } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                placementOrder: "not-an-array",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("PLACEMENT_ORDER_INVALID")
        })
    })

    describe("happy path", () => {
        it("should declare winners on final round with no tie", async () => {
            const { top3, contestant } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await res.json() as DeclareWinnersResponse

            expect(res.status).toBe(201)
            expect(json.message).toBe("Winners declared successfully")

            const resultsJson = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse
            expect(resultsJson.data.winnersDeclaredAt).not.toBeNull()
            expect(resultsJson.data.canDeclareWinners).toBe(false)

            const roundWinners = await prisma.roundWinner.findMany({
                where: { roundId: top3.id },
                orderBy: { placement: "asc" },
            })
            expect(roundWinners).toHaveLength(1)
            expect(roundWinners[0]).toMatchObject({
                roundId: top3.id,
                contestantId: contestant.id,
                placement: 1,
            })
            expect(Number(roundWinners[0]!.overallScore)).toBe(92)
        })

        it("should declare winners on final round with tie resolution", async () => {
            const { top3, contestants } = await seedFinalRoundTieAtCutoff()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const resultsBefore = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse
            expect(resultsBefore.data.advancement.hasTie).toBe(true)
            expect(resultsBefore.data.advancement.requiredSelections).toBe(1)

            const tiedPick = contestants[3]!
            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: [tiedPick.id],
            })

            expect(res.status).toBe(201)

            const resultsAfter = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse
            expect(resultsAfter.data.winnersDeclaredAt).not.toBeNull()
            expect(resultsAfter.data.canDeclareWinners).toBe(false)

            const roundWinners = await prisma.roundWinner.findMany({
                where: { roundId: top3.id },
                orderBy: { placement: "asc" },
            })
            expect(roundWinners).toHaveLength(3)

            const winnerContestantIds = roundWinners.map(row => row.contestantId)
            expect(winnerContestantIds).toContain(contestants[0]!.id)
            expect(winnerContestantIds).toContain(contestants[1]!.id)
            expect(winnerContestantIds).toContain(tiedPick.id)
            expect(winnerContestantIds).not.toContain(contestants[2]!.id)

            expect(roundWinners[0]).toMatchObject({
                contestantId: contestants[0]!.id,
                placement: 1,
            })
            expect(Number(roundWinners[0]!.overallScore)).toBe(95)
            expect(roundWinners[1]).toMatchObject({
                contestantId: contestants[1]!.id,
                placement: 2,
            })
            expect(Number(roundWinners[1]!.overallScore)).toBe(90)
            expect(roundWinners[2]).toMatchObject({
                contestantId: tiedPick.id,
                placement: 3,
            })
            expect(Number(roundWinners[2]!.overallScore)).toBe(85)
        })
    })

    describe("placement tie resolution", () => {
        it("should block declaring winners and expose placementTies when finalists tie in score", async () => {
            const { top3, contestants } = await seedFinalRoundPlacementTie()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const resultsJson = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse

            expect(resultsJson.data.advancement.hasTie).toBe(false)
            expect(resultsJson.data.canDeclareWinners).toBe(false)
            expect(resultsJson.data.placementTies).toHaveLength(1)

            const cluster = resultsJson.data.placementTies[0]!
            const tiedIds = cluster.contestants.map(c => c.id)
            expect(tiedIds).toContain(contestants[0]!.id)
            expect(tiedIds).toContain(contestants[1]!.id)
            expect(tiedIds).not.toContain(contestants[2]!.id)
        })

        it("should return PLACEMENT_ORDER_REQUIRED when declaring without resolving a placement tie", async () => {
            const { top3 } = await seedFinalRoundPlacementTie()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("PLACEMENT_ORDER_REQUIRED")
        })

        it("should return PLACEMENT_ORDER_MISMATCH when placementOrder does not match the tied contestants", async () => {
            const { top3, contestants } = await seedFinalRoundPlacementTie()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                placementOrder: [contestants[2]!.id],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("PLACEMENT_ORDER_MISMATCH")
        })

        it("should return PLACEMENT_ORDER_NOT_ALLOWED when sent without a placement tie", async () => {
            const { top3, contestant } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                placementOrder: [contestant.id],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("PLACEMENT_ORDER_NOT_ALLOWED")
        })

        it("should declare winners honoring the submitted placement order", async () => {
            const { top3, contestants } = await seedFinalRoundPlacementTie()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            // contestants[1] scored equal to contestants[0] but is chosen to place higher.
            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                placementOrder: [contestants[1]!.id, contestants[0]!.id],
            })

            expect(res.status).toBe(201)

            const roundWinners = await prisma.roundWinner.findMany({
                where: { roundId: top3.id },
                orderBy: { placement: "asc" },
            })
            expect(roundWinners).toHaveLength(3)
            expect(roundWinners[0]).toMatchObject({ contestantId: contestants[1]!.id, placement: 1 })
            expect(roundWinners[1]).toMatchObject({ contestantId: contestants[0]!.id, placement: 2 })
            expect(roundWinners[2]).toMatchObject({ contestantId: contestants[2]!.id, placement: 3 })
        })
    })

    describe("DECLARE_NOT_ALLOWED", () => {
        it("should return NOT_FINAL_ROUND on a non-final round", async () => {
            const { prelims } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 3201, name: "Prelims" })
            const field = await seedCriteriaField(category.id, "Score", 100)
            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({
                    judgeId: judge.id,
                    categoryId: category.id,
                    contestantId: contestant.id,
                    criteriaFieldId: field.id,
                    value: 90,
                })
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postDeclareWinners(cookieHeader, csrfToken, prelims.id, {})
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("DECLARE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("NOT_FINAL_ROUND")
        })

        it("should return JUDGES_NOT_COMPLETE when judges have not finished", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            await seedCategory({ name: "Talent", roundId: top3.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 3202, name: "Waiting" })
            await seedRoundContestant(top3.id, contestant.id)
            const field = await seedCriteriaField(category.id, "Score", 100)
            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({
                    judgeId: judge.id,
                    categoryId: category.id,
                    contestantId: contestant.id,
                    criteriaFieldId: field.id,
                    value: 88,
                })
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("DECLARE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("JUDGES_NOT_COMPLETE")
        })

        it("should return CURRENT_ROUND_NO_CATEGORIES when final round has no categories", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("DECLARE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("CURRENT_ROUND_NO_CATEGORIES")
        })

        it("should return WINNERS_ALREADY_DECLARED when winners were already declared", async () => {
            const declaredAt = new Date("2026-08-21T12:00:00.000Z")
            const top3 = await seedRound({
                name: "Top 3",
                phaseOrder: 3,
                contestantLimit: 3,
                winnersDeclaredAt: declaredAt,
            })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 3203, name: "Already" })
            await seedRoundContestant(top3.id, contestant.id)
            const field = await seedCriteriaField(category.id, "Score", 100)
            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({
                    judgeId: judge.id,
                    categoryId: category.id,
                    contestantId: contestant.id,
                    criteriaFieldId: field.id,
                    value: 91,
                })
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("DECLARE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("WINNERS_ALREADY_DECLARED")
        })

        it("should reject a second declare with WINNERS_ALREADY_DECLARED", async () => {
            const { top3 } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const first = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            expect(first.status).toBe(201)

            const second = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await second.json() as { error: { code: string; data: { reason: string } } }

            expect(second.status).toBe(409)
            expect(json.error.code).toBe("DECLARE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("WINNERS_ALREADY_DECLARED")
        })
    })

    describe("tie body validation", () => {
        it("should return SELECTED_CONTESTANT_IDS_NOT_ALLOWED when there is no tie", async () => {
            const { top3 } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: [999],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_NOT_ALLOWED")
        })

        it("should return SELECTED_CONTESTANT_IDS_REQUIRED when tie exists but body is empty", async () => {
            const { top3 } = await seedFinalRoundTieAtCutoff()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_REQUIRED")
        })

        it("should return SELECTED_CONTESTANT_IDS_COUNT_INVALID when tie selection count is wrong", async () => {
            const { top3, contestants } = await seedFinalRoundTieAtCutoff()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: [contestants[3]!.id, contestants[4]!.id],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_COUNT_INVALID")
        })
    })

    describe("gender-based declare winners", () => {
        const seedGenderScoredFinalist = async (
            top3: { id: number },
            category: { id: number },
            judgeOne: { id: number },
            judgeTwo: { id: number },
            gender: "MALE" | "FEMALE",
            candidateNumber: number,
            value: number,
        ) => {
            const contestant = await seedContestant({ candidateNumber, name: `${gender} ${candidateNumber}`, gender })
            await seedRoundContestant(top3.id, contestant.id)
            const field = await seedCriteriaField(category.id, "Score", 100)
            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({ judgeId: judge.id, categoryId: category.id, contestantId: contestant.id, criteriaFieldId: field.id, value })
            }
            return contestant
        }

        it("should declare two independent placement sequences, one per gender", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 2 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const female1 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "FEMALE", 5000, 95)
            const female2 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "FEMALE", 5001, 80)
            const male1 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "MALE", 5100, 90)
            const male2 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "MALE", 5101, 75)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            expect(res.status).toBe(201)

            const roundWinners = await prisma.roundWinner.findMany({
                where: { roundId: top3.id },
                orderBy: [{ gender: "asc" }, { placement: "asc" }],
            })

            expect(roundWinners).toHaveLength(4)
            expect(roundWinners).toContainEqual(expect.objectContaining({ contestantId: female1.id, gender: "FEMALE", placement: 1 }))
            expect(roundWinners).toContainEqual(expect.objectContaining({ contestantId: female2.id, gender: "FEMALE", placement: 2 }))
            expect(roundWinners).toContainEqual(expect.objectContaining({ contestantId: male1.id, gender: "MALE", placement: 1 }))
            expect(roundWinners).toContainEqual(expect.objectContaining({ contestantId: male2.id, gender: "MALE", placement: 2 }))
        })

        it("should resolve simultaneous ties in both genders when one pick per gender is provided", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const female1 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "FEMALE", 5200, 90)
            const female2 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "FEMALE", 5201, 90)
            const male1 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "MALE", 5300, 85)
            const male2 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "MALE", 5301, 85)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const before = await (await getRoundResults(cookieHeader, csrfToken, top3.id)).json() as GetRoundResultsResponse
            expect(before.data.advancement.hasTie).toBe(true)
            expect(before.data.advancement.requiredSelections).toBe(2)

            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: [female1.id, male1.id],
            })
            expect(res.status).toBe(201)

            const roundWinners = await prisma.roundWinner.findMany({ where: { roundId: top3.id } })
            expect(roundWinners).toHaveLength(2)
            const winnerIds = roundWinners.map((row) => row.contestantId)
            expect(winnerIds).toContain(female1.id)
            expect(winnerIds).toContain(male1.id)
            expect(winnerIds).not.toContain(female2.id)
            expect(winnerIds).not.toContain(male2.id)
        })

        it("should reject a declare where both picks come from the same gender's tie", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const female1 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "FEMALE", 5400, 90)
            const female2 = await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "FEMALE", 5401, 90)
            await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "MALE", 5500, 85)
            await seedGenderScoredFinalist(top3, category, judgeOne, judgeTwo, "MALE", 5501, 85)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: [female1.id, female2.id],
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("DECLARE_WINNER_COUNT_MISMATCH")
        })
    })

    describe("not found", () => {
        it("should return 404 when round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postDeclareWinners(cookieHeader, csrfToken, 99999, {})
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })
    })
})
