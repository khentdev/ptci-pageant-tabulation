import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { AdvanceRoundResponse, GetRoundResultsResponse } from "../types.js"

describe("Advance Round Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Advance Round Admin",
        username: "test-advance-round-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Advance Round Judge",
        username: "test-advance-round-judge",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ONE = {
        name: "AR Judge 1",
        username: "test-advance-round-judge-1",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_TWO = {
        name: "AR Judge 2",
        username: "test-advance-round-judge-2",
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

    const postAdvance = (
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

        return app.request(`/live-event/round-results/${roundId}/advancement`, {
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
        criteriaFieldId?: number,
    ) => {
        const fieldId = criteriaFieldId ?? (await seedCriteriaField(categoryId, "Score", 100)).id
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

    const seedScoredContestants = async (
        categoryId: number,
        judgeOneId: number,
        judgeTwoId: number,
        scores: number[],
        candidateStart: number,
    ) => {
        const contestants = []
        for (const [index, overall] of scores.entries()) {
            const contestant = await seedContestant({
                candidateNumber: candidateStart + index,
                name: `Contestant ${candidateStart + index}`,
            })
            contestants.push(contestant)
            const field = await seedCriteriaField(categoryId, "Score", 100)
            for (const judge of [judgeOneId, judgeTwoId]) {
                await seedScore({
                    judgeId: judge,
                    categoryId,
                    contestantId: contestant.id,
                    criteriaFieldId: field.id,
                    value: overall,
                })
            }
        }
        return contestants
    }

    const seedReadyToAdvanceClearTop5 = async () => {
        const { prelims, top5 } = await seedPreliminaryWithTop5()
        const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
        await seedCategory({ name: "Swimwear", roundId: top5.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)
        const scores = [95, 90, 85, 80, 75, 74, 73]
        const contestants = await seedScoredContestants(
            category.id,
            judgeOne.id,
            judgeTwo.id,
            scores,
            2000,
        )
        return { prelims, top5, contestants, judgeOne, judgeTwo, category }
    }

    const seedReadyToAdvanceSingle = async () => {
        const { prelims, top5 } = await seedPreliminaryWithTop5()
        const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
        await seedCategory({ name: "Swimwear", roundId: top5.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)
        const contestants = await seedScoredContestants(
            category.id,
            judgeOne.id,
            judgeTwo.id,
            [92],
            2100,
        )
        return { prelims, top5, contestants, judgeOne, judgeTwo, category }
    }

    const seedSevenContestantTieAtCutoff = async () => {
        const { prelims, top5 } = await seedPreliminaryWithTop5()
        const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
        await seedCategory({ name: "Swimwear", roundId: top5.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)
        const scores = [93, 89.75, 85.75, 82.75, 80.75, 80.75, 80.75]
        const contestants = await seedScoredContestants(
            category.id,
            judgeOne.id,
            judgeTwo.id,
            scores,
            2200,
        )
        return { prelims, top5, contestants, judgeOne, judgeTwo, category }
    }

    const expectRoundContestants = async (roundId: number, contestantIds: number[]) => {
        const rows = await prisma.roundContestant.findMany({
            where: { roundId },
            select: { contestantId: true },
        })
        expect(rows.map((row) => row.contestantId).sort()).toEqual([...contestantIds].sort())
    }

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
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
            const res = await app.request("/live-event/round-results/1/advancement", { method: "POST" })
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to advance a round", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
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
            const res = await postAdvance(cookieHeader, csrfToken, id, {})
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })

        it("should return SELECTED_CONTESTANT_IDS_INVALID when selectedContestantIds is not an array", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: "1",
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_INVALID")
            expect(json.error.field).toBe("advance_round_input_selected_contestant_ids")
        })

        it("should return SELECTED_CONTESTANT_ID_INVALID when an element is not a positive integer", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [1.5],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_ID_INVALID")
            expect(json.error.field).toBe("advance_round_input_selected_contestant_ids_0")
        })

        it("should return SELECTED_CONTESTANT_ID_INVALID when an element is zero", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [0],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_ID_INVALID")
            expect(json.error.field).toBe("advance_round_input_selected_contestant_ids_0")
        })

        it("should return SELECTED_CONTESTANT_IDS_DUPLICATE when ids are duplicated", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [1, 1],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_DUPLICATE")
            expect(json.error.field).toBe("advance_round_input_selected_contestant_ids")
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postAdvance(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })
    })

    describe("business rule rejections", () => {
        it("should return ADVANCE_NOT_ALLOWED with JUDGES_NOT_COMPLETE when judges have not finished", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            await seedCategory({ name: "Talent", roundId: prelims.id })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("JUDGES_NOT_COMPLETE")
        })

        it("should return ADVANCE_NOT_ALLOWED with CURRENT_ROUND_NO_CATEGORIES when current round has no categories", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            await seedUser(TEST_JUDGE_ONE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("CURRENT_ROUND_NO_CATEGORIES")
        })

        it("should return ADVANCE_NOT_ALLOWED with NEXT_ROUND_NO_CATEGORIES when next round has no categories", async () => {
            const { prelims } = await seedPreliminaryWithTop5()
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 2301, name: "No Next Cats" })
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 90)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("NEXT_ROUND_NO_CATEGORIES")
        })

        it("should return ADVANCE_NOT_ALLOWED with NEXT_ROUND_NO_CATEGORIES when next round has null contestantLimit", async () => {
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const nextRound = await seedRound({ name: "Unlimited Next", phaseOrder: 2, contestantLimit: null })
            const category = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: nextRound.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 2302, name: "Limit Null" })
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 90)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("NEXT_ROUND_NO_CATEGORIES")
        })

        it("should return ADVANCE_NOT_ALLOWED with ROUND_COMPLETED when next round already has contestants", async () => {
            const { prelims, top5 } = await seedReadyToAdvanceClearTop5()
            const advanced = await seedContestant({ candidateNumber: 2303, name: "Already There" })
            await seedRoundContestant(top5.id, advanced.id)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("ROUND_COMPLETED")
        })

        it("should return ADVANCE_NOT_ALLOWED on the final round", async () => {
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 2304, name: "Finalist" })
            await seedRoundContestant(top3.id, contestant.id)
            await seedSingleFieldCategoryScore(judge.id, category.id, contestant.id, 92)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, top3.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
        })

        it("should return ADVANCE_NOT_ALLOWED with NO_ELIGIBLE_CONTESTANTS when no contestants are in the round pool", async () => {
            const { top5 } = await seedPreliminaryWithTop5()
            const top5Category = await seedCategory({ name: "Swimwear", roundId: top5.id })
            await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
            await seedCategory({ name: "Swimwear", roundId: (await prisma.round.findFirst({ where: { phaseOrder: 3 } }))!.id })

            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestant = await seedContestant({ candidateNumber: 2305, name: "Not In Pool" })
            const field = await seedCriteriaField(top5Category.id, "Score", 100)
            for (const judge of [judgeOne, judgeTwo]) {
                await seedScore({
                    judgeId: judge.id,
                    categoryId: top5Category.id,
                    contestantId: contestant.id,
                    criteriaFieldId: field.id,
                    value: 90,
                })
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await postAdvance(cookieHeader, csrfToken, top5.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("NO_ELIGIBLE_CONTESTANTS")
        })
    })

    describe("tie body rejections", () => {
        it("should return SELECTED_CONTESTANT_IDS_REQUIRED when tie exists and body is omitted", async () => {
            const { prelims } = await seedSevenContestantTieAtCutoff()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_REQUIRED")
            expect(json.error.field).toBe("advance_round_input_selected_contestant_ids")
        })

        it("should return SELECTED_CONTESTANT_IDS_REQUIRED when tie exists and empty array is sent", async () => {
            const { prelims } = await seedSevenContestantTieAtCutoff()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_REQUIRED")
        })

        it("should return SELECTED_CONTESTANT_IDS_COUNT_INVALID when too many tied picks are sent", async () => {
            const { prelims, contestants } = await seedSevenContestantTieAtCutoff()
            const tiedIds = contestants.slice(4, 7).map((c) => c.id)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: tiedIds,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_COUNT_INVALID")
            expect(json.error.field).toBe("advance_round_input_selected_contestant_ids")
        })

        it("should return SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP when an included contestant is selected", async () => {
            const { prelims, contestants } = await seedSevenContestantTieAtCutoff()
            const includedId = contestants[0]!.id
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [includedId],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP")
        })

        it("should return SELECTED_CONTESTANT_IDS_NOT_ALLOWED when ids are sent with no tie", async () => {
            const { prelims, contestants } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [contestants[0]!.id],
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SELECTED_CONTESTANT_IDS_NOT_ALLOWED")
        })
    })

    describe("happy path — no tie", () => {
        it("should advance top N with empty body when rankings are clear", async () => {
            const { prelims, top5, contestants } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            expect(res.status).toBe(201)

            const json = await res.json() as AdvanceRoundResponse
            expect(json.message).toBe("Round advanced successfully")

            const expectedIds = contestants.slice(0, 5).map((c) => c.id)
            await expectRoundContestants(top5.id, expectedIds)

            const getRes = await getRoundResults(cookieHeader, csrfToken, prelims.id)
            const getJson = await getRes.json() as GetRoundResultsResponse
            expect(getJson.data.isCompleted).toBe(true)
            expect(getJson.data.canAdvance).toBe(false)
            expect(getJson.data.canAdvanceReason).toBe("ROUND_COMPLETED")
        })

        it("should advance top N with empty object body when rankings are clear", async () => {
            const { prelims, top5, contestants } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {})
            expect(res.status).toBe(201)

            const expectedIds = contestants.slice(0, 5).map((c) => c.id)
            await expectRoundContestants(top5.id, expectedIds)
        })

        it("should advance fewer than limit when eligible contestants are below limit", async () => {
            const { prelims, top5, contestants } = await seedReadyToAdvanceSingle()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            expect(res.status).toBe(201)

            await expectRoundContestants(top5.id, [contestants[0]!.id])
        })

        it("should not insert round_contestants on the current prelims round", async () => {
            const { prelims, top5 } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            expect(res.status).toBe(201)

            const prelimsRows = await prisma.roundContestant.count({ where: { roundId: prelims.id } })
            const top5Rows = await prisma.roundContestant.count({ where: { roundId: top5.id } })
            expect(prelimsRows).toBe(0)
            expect(top5Rows).toBe(5)
        })

        it("should reject a second advance with ADVANCE_NOT_ALLOWED", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const first = await postAdvance(cookieHeader, csrfToken, prelims.id)
            expect(first.status).toBe(201)

            const second = await postAdvance(cookieHeader, csrfToken, prelims.id)
            const json = await second.json() as { error: { code: string; data: { reason: string } } }

            expect(second.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("ROUND_COMPLETED")
        })
    })

    describe("happy path — tie at cutoff", () => {
        it("should advance included plus one selected tied contestant", async () => {
            const { prelims, top5, contestants } = await seedSevenContestantTieAtCutoff()
            const selectedId = contestants[4]!.id
            const includedIds = contestants.slice(0, 4).map((c) => c.id)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [selectedId],
            })
            expect(res.status).toBe(201)

            await expectRoundContestants(top5.id, [...includedIds, selectedId])
        })

        it("should return completed state with empty advancement after tie advance", async () => {
            const { prelims, contestants } = await seedSevenContestantTieAtCutoff()
            const selectedId = contestants[5]!.id
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [selectedId],
            })

            const getRes = await getRoundResults(cookieHeader, csrfToken, prelims.id)
            const getJson = await getRes.json() as GetRoundResultsResponse

            expect(getJson.data.isCompleted).toBe(true)
            expect(getJson.data.advancement.included).toEqual([])
            expect(getJson.data.advancement.hasTie).toBe(false)
        })

        it("should include advanced contestant in the next round rankings pool", async () => {
            const { prelims, top5, contestants } = await seedSevenContestantTieAtCutoff()
            const selectedId = contestants[6]!.id
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAdvance(cookieHeader, csrfToken, prelims.id, {
                selectedContestantIds: [selectedId],
            })

            const getRes = await getRoundResults(cookieHeader, csrfToken, top5.id)
            const getJson = await getRes.json() as GetRoundResultsResponse

            expect(getJson.data.rankings.map((row) => row.contestant.id)).toContain(selectedId)
            expect(getJson.data.rankings).toHaveLength(5)
        })
    })

    describe("post-advance verification", () => {
        it("should not change score rows when advancing", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const scoreCountBefore = await prisma.score.count()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            expect(res.status).toBe(201)

            const scoreCountAfter = await prisma.score.count()
            expect(scoreCountAfter).toBe(scoreCountBefore)
        })

        it("should return ADVANCE_NOT_ALLOWED when advancing a Top N round that is not ready", async () => {
            const { prelims, top5 } = await seedPreliminaryWithTop5()
            const prelimsCategory = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Swimwear", roundId: top5.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const contestants = await seedScoredContestants(
                prelimsCategory.id,
                judgeOne.id,
                judgeTwo.id,
                [95, 90, 85, 80, 75, 74, 73],
                2400,
            )

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            await postAdvance(cookieHeader, csrfToken, prelims.id)

            await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })

            const res = await postAdvance(cookieHeader, csrfToken, top5.id)
            const json = await res.json() as { error: { code: string; data: { reason: string } } }

            expect(res.status).toBe(409)
            expect(json.error.code).toBe("ADVANCE_NOT_ALLOWED")
            expect(json.error.data.reason).toBe("JUDGES_NOT_COMPLETE")
        })

        it("should advance from Top 5 to Top 3 when ready", async () => {
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })

            const prelimsCategory = await seedCategory({ name: "Swimwear", roundId: prelims.id })
            const top5Category = await seedCategory({ name: "Swimwear", roundId: top5.id })
            await seedCategory({ name: "Swimwear", roundId: top3.id })

            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const prelimsContestants = await seedScoredContestants(
                prelimsCategory.id,
                judgeOne.id,
                judgeTwo.id,
                [95, 90, 85, 80, 75, 74, 73],
                2500,
            )

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            await postAdvance(cookieHeader, csrfToken, prelims.id)

            const top5Contestants = prelimsContestants.slice(0, 5)
            const field = await seedCriteriaField(top5Category.id, "Score", 100)
            const scores = [94, 91, 88, 85, 82]
            for (const [index, contestant] of top5Contestants.entries()) {
                for (const judge of [judgeOne.id, judgeTwo.id]) {
                    await seedScore({
                        judgeId: judge,
                        categoryId: top5Category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: field.id,
                        value: scores[index]!,
                    })
                }
            }

            const res = await postAdvance(cookieHeader, csrfToken, top5.id)
            expect(res.status).toBe(201)

            const expectedTop3 = top5Contestants.slice(0, 3).map((c) => c.id)
            await expectRoundContestants(top3.id, expectedTop3)
        })
    })

    describe("response contract", () => {
        it("should return 201 with message only on success", async () => {
            const { prelims } = await seedReadyToAdvanceClearTop5()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAdvance(cookieHeader, csrfToken, prelims.id)
            expect(res.status).toBe(201)

            const json = await res.json() as AdvanceRoundResponse
            expect(json).toEqual({ message: "Round advanced successfully" })
            expect(json).not.toHaveProperty("data")
        })
    })
})
