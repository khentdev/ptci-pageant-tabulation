import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetJudgeSubmissionsResponse } from "../types.js"

describe("Get Judge Submissions Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Judge Submissions Admin",
        username: "test-get-judge-submissions-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Judge Submissions Judge",
        username: "test-get-judge-submissions-judge",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ONE = {
        name: "Judge 1",
        username: "test-get-judge-submissions-judge-1",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_TWO = {
        name: "Judge 2",
        username: "test-get-judge-submissions-judge-2",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_THREE = {
        name: "Judge 3",
        username: "test-get-judge-submissions-judge-3",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ALICE = {
        name: "Alice",
        username: "test-get-judge-submissions-judge-alice",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_BOB = {
        name: "Bob",
        username: "test-get-judge-submissions-judge-bob",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_CHARLIE = {
        name: "Charlie",
        username: "test-get-judge-submissions-judge-charlie",
        role: "JUDGE" as Role,
    }

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        TEST_JUDGE_ONE.username,
        TEST_JUDGE_TWO.username,
        TEST_JUDGE_THREE.username,
        TEST_JUDGE_ALICE.username,
        TEST_JUDGE_BOB.username,
        TEST_JUDGE_CHARLIE.username,
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

    const getJudgeSubmissions = (cookieHeader: string, csrfToken: string, roundId: number | string) =>
        app.request(`/live-event/round-results/${roundId}`, {
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
                name: true,
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
        return prisma.criteriaField.createMany({
            data: fields.map((field) => ({
                categoryId,
                name: field.name,
                maxValue: field.maxValue,
            })),
        })
    }

    const seedContestant = async (data: {
        candidateNumber: number
        name: string
        gender?: "MALE" | "FEMALE"
        teamName?: string
        teamColor?: string
    }) => {
        return prisma.contestant.create({
            data: {
                candidateNumber: data.candidateNumber,
                name: data.name,
                gender: data.gender ?? "FEMALE",
                teamName: data.teamName ?? "Team A",
                teamColor: data.teamColor ?? "Red",
            },
            select: { id: true },
        })
    }

    const seedCategorySubmission = async ({
        judgeId,
        categoryId,
        contestantId,
        criteriaFieldId,
        value = 85,
    }: {
        judgeId: number
        categoryId: number
        contestantId: number
        criteriaFieldId: number
        value?: number
    }) => {
        await prisma.score.create({
            data: {
                judgeId,
                contestantId,
                categoryId,
                criteriaFieldId,
                value,
            },
        })
    }

    const seedScoringContext = async (categoryId: number) => {
        const contestant = await seedContestant({
            candidateNumber: Date.now() % 100000,
            name: "Test Contestant",
        })
        const criteriaField = await prisma.criteriaField.create({
            data: {
                categoryId,
                name: "Stage Presence",
                maxValue: 100,
            },
            select: { id: true },
        })

        return { contestant, criteriaField }
    }

    const cleanupTestData = async () => {
        await prisma.score.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: testUsernames,
                },
            },
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
            const res = await app.request("/live-event/round-results/1", {
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get judge submissions", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "round id is not a number",
                id: "abc",
                code: "ROUND_ID_INVALID",
            },
            {
                testCase: "round id is zero",
                id: "0",
                code: "ROUND_ID_INVALID",
            },
            {
                testCase: "round id is negative",
                id: "-1",
                code: "ROUND_ID_INVALID",
            },
            {
                testCase: "round id is not an integer",
                id: "1.5",
                code: "ROUND_ID_INVALID",
            },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeSubmissions(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeSubmissions(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })
    })

    describe("happy path", () => {
        it("should return empty judge submissions when no judges and no categories exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeSubmissionsResponse
            expect(json.message).toBe("Judge submissions fetched successfully")
            expect(json.data).toEqual({
                judgeSubmissions: [],
                fullySubmittedCount: 0,
                totalJudges: 0,
                allJudgesSubmitted: false,
            })
        })

        it("should return wireframe State 1 partial submission matrix", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const formal = await seedCategory({ name: "Formal Wear", roundId: round.id })
            const production = await seedCategory({ name: "Production", roundId: round.id })

            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const judgeThree = await seedUser(TEST_JUDGE_THREE)

            const contestant = await seedContestant({
                candidateNumber: 101,
                name: "State One Contestant",
            })

            for (const category of [swimwear, talent, formal, production]) {
                const criteriaField = await prisma.criteriaField.create({
                    data: {
                        categoryId: category.id,
                        name: "Score",
                        maxValue: 100,
                    },
                    select: { id: true },
                })

                await seedCategorySubmission({
                    judgeId: judgeOne.id,
                    categoryId: category.id,
                    contestantId: contestant.id,
                    criteriaFieldId: criteriaField.id,
                })

                if (category.id !== production.id) {
                    await seedCategorySubmission({
                        judgeId: judgeTwo.id,
                        categoryId: category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: criteriaField.id,
                    })
                }
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeSubmissionsResponse
            expect(json.data.totalJudges).toBe(3)
            expect(json.data.fullySubmittedCount).toBe(1)
            expect(json.data.allJudgesSubmitted).toBe(false)
            expect(json.data.judgeSubmissions).toHaveLength(3)

            const judgeOneRow = json.data.judgeSubmissions.find((row) => row.judge.id === judgeOne.id)!
            const judgeTwoRow = json.data.judgeSubmissions.find((row) => row.judge.id === judgeTwo.id)!
            const judgeThreeRow = json.data.judgeSubmissions.find((row) => row.judge.id === judgeThree.id)!

            expect(judgeOneRow).toEqual({
                judge: { id: judgeOne.id, name: TEST_JUDGE_ONE.name },
                categories: [
                    { id: formal.id, name: "Formal Wear", submitted: true },
                    { id: production.id, name: "Production", submitted: true },
                    { id: swimwear.id, name: "Swimwear", submitted: true },
                    { id: talent.id, name: "Talent", submitted: true },
                ],
                fullySubmitted: true,
            })
            expect(judgeTwoRow.fullySubmitted).toBe(false)
            expect(judgeTwoRow.categories.map((c) => c.submitted)).toEqual([true, false, true, true])
            expect(judgeThreeRow.fullySubmitted).toBe(false)
            expect(judgeThreeRow.categories.every((c) => c.submitted === false)).toBe(true)
        })

        it("should return State 2 when all judges submitted all categories", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })

            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)

            const contestant = await seedContestant({
                candidateNumber: 202,
                name: "State Two Contestant",
            })

            for (const category of [swimwear, talent]) {
                const criteriaField = await prisma.criteriaField.create({
                    data: {
                        categoryId: category.id,
                        name: "Score",
                        maxValue: 100,
                    },
                    select: { id: true },
                })

                for (const judge of [judgeOne, judgeTwo]) {
                    await seedCategorySubmission({
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: criteriaField.id,
                    })
                }
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeSubmissionsResponse
            expect(json.data.allJudgesSubmitted).toBe(true)
            expect(json.data.fullySubmittedCount).toBe(json.data.totalJudges)
            expect(json.data.judgeSubmissions.every((row) => row.fullySubmitted)).toBe(true)
            expect(json.data.judgeSubmissions.every((row) => row.categories.every((c) => c.submitted))).toBe(true)
        })

        it("should not expose sensitive fields in the response", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { contestant, criteriaField } = await seedScoringContext(category.id)

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: category.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField.id,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeSubmissionsResponse
            for (const row of json.data.judgeSubmissions) {
                expect("username" in row.judge).toBe(false)
                expect("role" in row.judge).toBe(false)
                expect("hashedPassword" in row.judge).toBe(false)
                expect("value" in row).toBe(false)
                expect("submittedAt" in row).toBe(false)
            }
        })
    })

    describe("business rules", () => {
        it("should mark only seeded judge and category pairs as submitted", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { contestant, criteriaField } = await seedScoringContext(swimwear.id)

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: swimwear.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField.id,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            const row = json.data.judgeSubmissions[0]!
            expect(row.categories).toEqual([
                { id: swimwear.id, name: "Swimwear", submitted: true },
                { id: talent.id, name: "Talent", submitted: false },
            ])
        })

        it.each([0, 50])("should mark submitted when a single score exists with value %s", async (value) => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { contestant, criteriaField } = await seedScoringContext(category.id)

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: category.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField.id,
                value,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories[0]!.submitted).toBe(true)
        })

        it("should return allJudgesSubmitted false when zero judges exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions).toEqual([])
            expect(json.data.allJudgesSubmitted).toBe(false)
        })

        it("should exclude admin users from judge submissions", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedUser(TEST_JUDGE_ONE)
            await seedUser(TEST_JUDGE_TWO)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions).toHaveLength(2)
            expect(json.data.judgeSubmissions.some((row) => row.judge.name === TEST_ADMIN.name)).toBe(false)
        })

        it("should scope submissions to the requested round only", async () => {
            const roundA = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const roundB = await seedRound({ name: "Top 10", phaseOrder: 2 })
            const categoryA = await seedCategory({ name: "Swimwear", roundId: roundA.id })
            const categoryB = await seedCategory({ name: "Swimwear", roundId: roundB.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { contestant, criteriaField } = await seedScoringContext(categoryA.id)

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: categoryA.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField.id,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, roundB.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories).toEqual([
                { id: categoryB.id, name: "Swimwear", submitted: false },
            ])
        })

        it("should return judges ordered by name ascending", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedUser(TEST_JUDGE_CHARLIE)
            await seedUser(TEST_JUDGE_ALICE)
            await seedUser(TEST_JUDGE_BOB)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions.map((row) => row.judge.name)).toEqual(["Alice", "Bob", "Charlie"])
        })

        it("should return categories ordered by name ascending", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const formal = await seedCategory({ name: "Formal Wear", roundId: round.id })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedUser(TEST_JUDGE_ONE)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories.map((c) => c.name)).toEqual([
                formal.name,
                swimwear.name,
                talent.name,
            ])
            expect(json.data.judgeSubmissions[0]!.categories.map((c) => c.id)).toEqual([
                formal.id,
                swimwear.id,
                talent.id,
            ])
        })
    })

    describe("edge cases", () => {
        it("should treat judges as fully submitted when the round has zero categories", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedUser(TEST_JUDGE_ONE)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]).toEqual({
                judge: { id: expect.any(Number), name: TEST_JUDGE_ONE.name },
                categories: [],
                fullySubmitted: true,
            })
            expect(json.data.allJudgesSubmitted).toBe(true)
        })

        it("should return all unsubmitted flags when categories exist but no scores exist", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedUser(TEST_JUDGE_ONE)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories.every((c) => c.submitted === false)).toBe(true)
            expect(json.data.judgeSubmissions[0]!.fullySubmitted).toBe(false)
            expect(json.data.allJudgesSubmitted).toBe(false)
        })

        it("should return one submitted flag when many score rows exist for the same judge and category", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestantOne = await seedContestant({ candidateNumber: 301, name: "Contestant 1" })
            const contestantTwo = await seedContestant({ candidateNumber: 302, name: "Contestant 2" })
            const fieldOne = await prisma.criteriaField.create({
                data: { categoryId: category.id, name: "Presence", maxValue: 50 },
                select: { id: true },
            })
            const fieldTwo = await prisma.criteriaField.create({
                data: { categoryId: category.id, name: "Poise", maxValue: 50 },
                select: { id: true },
            })

            await prisma.score.createMany({
                data: [
                    {
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestantOne.id,
                        criteriaFieldId: fieldOne.id,
                        value: 40,
                    },
                    {
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestantOne.id,
                        criteriaFieldId: fieldTwo.id,
                        value: 45,
                    },
                    {
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestantTwo.id,
                        criteriaFieldId: fieldOne.id,
                        value: 35,
                    },
                ],
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories).toEqual([
                { id: category.id, name: "Swimwear", submitted: true },
            ])
        })

        it("should return judges and categories when the round has no contestants", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: round.id })
            await seedUser(TEST_JUDGE_ONE)

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions).toHaveLength(1)
            expect(json.data.judgeSubmissions[0]!.categories).toHaveLength(1)
            expect(json.data.judgeSubmissions[0]!.categories[0]!.submitted).toBe(false)
        })
    })

    describe("non-obvious behavior", () => {
        it("should mark submitted when score value is not 100", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { contestant, criteriaField } = await seedScoringContext(category.id)

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: category.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField.id,
                value: 42,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories[0]!.submitted).toBe(true)
        })

        it("should mark submitted when only one criteria field has a score", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const category = await seedCategory({ name: "Swimwear", roundId: round.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const contestant = await seedContestant({ candidateNumber: 401, name: "Partial Contestant" })
            await seedCriteriaFields(category.id, [
                { name: "Presence", maxValue: 50 },
                { name: "Poise", maxValue: 50 },
            ])
            const criteriaField = await prisma.criteriaField.findFirst({
                where: { categoryId: category.id },
                select: { id: true },
            })

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: category.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField!.id,
                value: 25,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories[0]!.submitted).toBe(true)
        })

        it("should derive fullySubmittedCount from fullySubmitted rows", async () => {
            const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const swimwear = await seedCategory({ name: "Swimwear", roundId: round.id })
            const talent = await seedCategory({ name: "Talent", roundId: round.id })
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            await seedUser(TEST_JUDGE_THREE)
            const contestant = await seedContestant({ candidateNumber: 501, name: "Count Contestant" })

            for (const category of [swimwear, talent]) {
                const criteriaField = await prisma.criteriaField.create({
                    data: { categoryId: category.id, name: "Score", maxValue: 100 },
                    select: { id: true },
                })

                for (const judge of [judgeOne, judgeTwo]) {
                    await seedCategorySubmission({
                        judgeId: judge.id,
                        categoryId: category.id,
                        contestantId: contestant.id,
                        criteriaFieldId: criteriaField.id,
                    })
                }
            }

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, round.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            const manualCount = json.data.judgeSubmissions.filter((row) => row.fullySubmitted).length
            expect(json.data.fullySubmittedCount).toBe(manualCount)
            expect(json.data.fullySubmittedCount).toBe(2)
        })

        it("should ignore scores from another round when querying a different round", async () => {
            const roundA = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const roundB = await seedRound({ name: "Top 10", phaseOrder: 2 })
            const categoryA = await seedCategory({ name: "Swimwear", roundId: roundA.id })
            const categoryB = await seedCategory({ name: "Talent", roundId: roundB.id })
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { contestant, criteriaField } = await seedScoringContext(categoryA.id)

            await seedCategorySubmission({
                judgeId: judge.id,
                categoryId: categoryA.id,
                contestantId: contestant.id,
                criteriaFieldId: criteriaField.id,
            })

            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getJudgeSubmissions(cookieHeader, csrfToken, roundB.id)
            const json = await res.json() as GetJudgeSubmissionsResponse

            expect(json.data.judgeSubmissions[0]!.categories).toEqual([
                { id: categoryB.id, name: "Talent", submitted: false },
            ])
        })
    })
})
