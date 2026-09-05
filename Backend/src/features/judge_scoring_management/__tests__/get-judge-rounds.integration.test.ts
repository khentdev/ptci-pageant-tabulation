import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetJudgeRoundsResponse } from "../types.js"

describe("Get Judge Rounds Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Judge Rounds Admin",
        username: "test-get-judge-rounds-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Judge Rounds Judge",
        username: "test-get-judge-rounds-judge",
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

    const getJudgeRounds = (cookieHeader: string, csrfToken: string) =>
        app.request("/judge-scoring/rounds", {
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

    const seedCategory = async (data: { name: string; roundId: number }) =>
        prisma.category.create({
            data: { name: data.name, roundId: data.roundId },
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
            const res = await app.request("/judge-scoring/rounds")
            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if an admin attempts to view judge rounds", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeRounds(cookieHeader, csrfToken)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return an empty list when there are no rounds", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const res = await getJudgeRounds(cookieHeader, csrfToken)
            const json = await res.json() as GetJudgeRoundsResponse

            expect(res.status).toBe(200)
            expect(json.data).toEqual([])
        })

        it("should return rounds ordered by phase order with categories ordered by name", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedCategory({ name: "Swimwear", roundId: prelims.id })
            await seedCategory({ name: "Formal Wear", roundId: prelims.id })

            const res = await getJudgeRounds(cookieHeader, csrfToken)
            const json = await res.json() as GetJudgeRoundsResponse

            expect(res.status).toBe(200)
            expect(json.data.map((round) => round.id)).toEqual([prelims.id, top5.id])
            expect(json.data[0]!.categories.map((category) => category.name)).toEqual(["Formal Wear", "Swimwear"])
            expect(json.data[1]!.categories).toEqual([])
        })

        it("should mark phase order 1 as having contestants whenever any contestant exists", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const prelims = await seedRound({ name: "Preliminary", phaseOrder: 1 })
            await seedContestant(1, "Contestant A")

            const res = await getJudgeRounds(cookieHeader, csrfToken)
            const json = await res.json() as GetJudgeRoundsResponse

            expect(json.data.find((round) => round.id === prelims.id)?.hasContestants).toBe(true)
        })

        it("should mark a later round as having no contestants until it has been populated via advancement", async () => {
            const { cookieHeader, csrfToken } = await seedJudgeCredentials()

            const top5 = await seedRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })

            const beforeRes = await getJudgeRounds(cookieHeader, csrfToken)
            const beforeJson = await beforeRes.json() as GetJudgeRoundsResponse
            expect(beforeJson.data.find((round) => round.id === top5.id)?.hasContestants).toBe(false)

            const contestant = await seedContestant(1, "Contestant A")
            await prisma.roundContestant.create({ data: { roundId: top5.id, contestantId: contestant.id } })

            const afterRes = await getJudgeRounds(cookieHeader, csrfToken)
            const afterJson = await afterRes.json() as GetJudgeRoundsResponse
            expect(afterJson.data.find((round) => round.id === top5.id)?.hasContestants).toBe(true)
        })
    })
})
