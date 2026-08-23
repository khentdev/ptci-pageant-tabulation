import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetDeclaredWinnersResponse } from "../types.js"

describe("Get Declared Winners Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Declared Winners Admin",
        username: "test-get-declared-winners-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Declared Winners Judge",
        username: "test-get-declared-winners-judge",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ONE = {
        name: "GDW Judge 1",
        username: "test-get-declared-winners-judge-1",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_TWO = {
        name: "GDW Judge 2",
        username: "test-get-declared-winners-judge-2",
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

    const getDeclaredWinners = (cookieHeader: string, csrfToken: string, roundId: number | string) =>
        app.request(`/live-event/round-results/${roundId}/declared-winners`, {
            method: "GET",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
        })

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

    const seedRoundContestant = async (roundId: number, contestantId: number) => {
        await prisma.roundContestant.create({
            data: { roundId, contestantId },
        })
    }

    const seedFinalRoundReady = async () => {
        const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
        const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)
        const contestant = await seedContestant({ candidateNumber: 4001, name: "Finalist" })
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
        return { top3, contestant }
    }

    const seedFinalRoundTieAtCutoff = async () => {
        const top3 = await seedRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })
        const category = await seedCategory({ name: "Swimwear", roundId: top3.id })
        const judgeOne = await seedUser(TEST_JUDGE_ONE)
        const judgeTwo = await seedUser(TEST_JUDGE_TWO)

        const scores = [95, 90, 85, 85, 80]
        const contestants = []
        for (const [index, overall] of scores.entries()) {
            const contestant = await seedContestant({ candidateNumber: 4100 + index, name: `Final ${index}` })
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

        return { top3, contestants }
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
            const res = await app.request("/live-event/round-results/1/declared-winners", { method: "GET" })
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get declared winners", async () => {
            const { top3 } = await seedFinalRoundReady()
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getDeclaredWinners(cookieHeader, csrfToken, top3.id)
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
            const res = await getDeclaredWinners(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("not found", () => {
        it("should return 404 when round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const res = await getDeclaredWinners(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })
    })

    describe("core flow", () => {
        it("should return declaredWinners null when winners are not declared", async () => {
            const { top3 } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getDeclaredWinners(cookieHeader, csrfToken, top3.id)
            const json = await res.json() as GetDeclaredWinnersResponse

            expect(res.status).toBe(200)
            expect(json.data.declaredWinners).toBeNull()
        })

        it("should return declared winners after declare with no tie", async () => {
            const { top3, contestant } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const declareRes = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})
            expect(declareRes.status).toBe(201)

            const res = await getDeclaredWinners(cookieHeader, csrfToken, top3.id)
            const json = await res.json() as GetDeclaredWinnersResponse

            expect(res.status).toBe(200)
            expect(json.data.declaredWinners).toHaveLength(1)
            expect(json.data.declaredWinners![0]).toMatchObject({
                placement: 1,
                contestant: {
                    id: contestant.id,
                    candidateNumber: contestant.candidateNumber,
                    name: contestant.name,
                },
                overallScore: 92,
            })
        })

        it("should return declared winners after tie resolution with correct third place", async () => {
            const { top3, contestants } = await seedFinalRoundTieAtCutoff()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const tiedPick = contestants[3]!
            const declareRes = await postDeclareWinners(cookieHeader, csrfToken, top3.id, {
                selectedContestantIds: [tiedPick.id],
            })
            expect(declareRes.status).toBe(201)

            const res = await getDeclaredWinners(cookieHeader, csrfToken, top3.id)
            const json = await res.json() as GetDeclaredWinnersResponse

            expect(res.status).toBe(200)
            expect(json.data.declaredWinners).toHaveLength(3)

            const winnerIds = json.data.declaredWinners!.map(row => row.contestant.id)
            expect(winnerIds).toContain(contestants[0]!.id)
            expect(winnerIds).toContain(contestants[1]!.id)
            expect(winnerIds).toContain(tiedPick.id)
            expect(winnerIds).not.toContain(contestants[2]!.id)

            expect(json.data.declaredWinners![0]).toMatchObject({
                placement: 1,
                contestant: { id: contestants[0]!.id },
                overallScore: 95,
            })
            expect(json.data.declaredWinners![1]).toMatchObject({
                placement: 2,
                contestant: { id: contestants[1]!.id },
                overallScore: 90,
            })
            expect(json.data.declaredWinners![2]).toMatchObject({
                placement: 3,
                contestant: { id: tiedPick.id },
                overallScore: 85,
            })
        })
    })

    describe("edge cases", () => {
        it("should return declaredWinners null on a non-final round that was never declared", async () => {
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getDeclaredWinners(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as GetDeclaredWinnersResponse

            expect(res.status).toBe(200)
            expect(json.data.declaredWinners).toBeNull()
        })

        it("should return identical payload on repeated GET after declare", async () => {
            const { top3 } = await seedFinalRoundReady()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postDeclareWinners(cookieHeader, csrfToken, top3.id, {})

            const first = await (await getDeclaredWinners(cookieHeader, csrfToken, top3.id)).json() as GetDeclaredWinnersResponse
            const second = await (await getDeclaredWinners(cookieHeader, csrfToken, top3.id)).json() as GetDeclaredWinnersResponse

            expect(first.data.declaredWinners).toEqual(second.data.declaredWinners)
        })

        it("should return empty declaredWinners when winnersDeclaredAt is set but no RoundWinner rows exist", async () => {
            const declaredAt = new Date("2026-08-21T12:00:00.000Z")
            const top3 = await seedRound({
                name: "Top 3",
                phaseOrder: 3,
                contestantLimit: 3,
                winnersDeclaredAt: declaredAt,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getDeclaredWinners(cookieHeader, csrfToken, top3.id)
            const json = await res.json() as GetDeclaredWinnersResponse

            expect(res.status).toBe(200)
            expect(json.data.declaredWinners).toEqual([])
        })
    })
})
