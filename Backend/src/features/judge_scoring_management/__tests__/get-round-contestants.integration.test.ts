import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetRoundContestantsResponse } from "../types.js"

describe("Get Round Contestants Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Round Contestants Admin",
        username: "test-get-round-contestants-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Round Contestants Judge",
        username: "test-get-round-contestants-judge",
        role: "JUDGE" as Role,
    }

    const testUsernames = [TEST_ADMIN.username, TEST_JUDGE.username]

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

    const getRoundContestants = (cookieHeader: string, csrfToken: string, roundId: number | string) =>
        app.request(`/judge-scoring/rounds/${roundId}/contestants`, {
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
            data: { name: user.name, username: user.username, hashedPassword, role: user.role },
            select: { id: true },
        })
    }

    const seedAdminCredentials = async () => {
        await seedUser(TEST_ADMIN)
        return loginAndGetCredentials(TEST_ADMIN.username)
    }

    const seedJudgeCredentials = async () => {
        await seedUser(TEST_JUDGE)
        return loginAndGetCredentials(TEST_JUDGE.username)
    }

    const seedRound = async (data: { name: string; phaseOrder: number; contestantLimit?: number | null }) =>
        prisma.round.create({
            data: {
                name: data.name,
                phaseOrder: data.phaseOrder,
                contestantLimit: data.contestantLimit ?? null,
            },
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
            const res = await app.request("/judge-scoring/rounds/1/contestants")
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if an admin attempts to view round contestants", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })

            const res = await getRoundContestants(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return all contestants for the first round, ordered by candidate number", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            const second = await seedContestant(2, "Contestant B")
            const first = await seedContestant(1, "Contestant A")

            const res = await getRoundContestants(cookieHeader, csrfToken, prelims.id)
            const json = await res.json() as GetRoundContestantsResponse

            expect(res.status).toBe(200)
            expect(json.data).toEqual([
                { id: first.id, candidateNumber: 1, name: "Contestant A" },
                { id: second.id, candidateNumber: 2, name: "Contestant B" },
            ])
        })

        it("should return only advanced contestants for a later round, ordered by candidate number", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const advanced = await seedContestant(1, "Advanced Contestant")
            await seedContestant(2, "Not Advanced Contestant")
            await prisma.roundContestant.create({ data: { roundId: top5.id, contestantId: advanced.id } })

            const res = await getRoundContestants(cookieHeader, csrfToken, top5.id)
            const json = await res.json() as GetRoundContestantsResponse

            expect(res.status).toBe(200)
            expect(json.data).toEqual([{ id: advanced.id, candidateNumber: 1, name: "Advanced Contestant" }])
        })

        it("should return an empty array when a later round has no contestants yet", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()
            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })

            const res = await getRoundContestants(cookieHeader, csrfToken, top5.id)
            const json = await res.json() as GetRoundContestantsResponse

            expect(res.status).toBe(200)
            expect(json.data).toEqual([])
        })
    })

    describe("validation", () => {
        it.each([
            { testCase: "id is not numeric", id: "abc" },
            { testCase: "id is zero", id: "0" },
            { testCase: "id is negative", id: "-1" },
            { testCase: "id is decimal", id: "1.5" },
        ])("should return SCORING_ROUND_ID_INVALID if $testCase", async ({ id }) => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await getRoundContestants(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("SCORING_ROUND_ID_INVALID")
            expect(json.error.field).toBe("get_round_contestants_input_id")
        })
    })

    describe("business rules", () => {
        it("should return SCORING_ROUND_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await getRoundContestants(cookieHeader, csrfToken, 999999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("SCORING_ROUND_NOT_FOUND")
        })
    })
})
