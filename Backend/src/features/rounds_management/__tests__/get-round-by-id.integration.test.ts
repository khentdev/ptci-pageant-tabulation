import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetRoundByIdResponse } from "../types.js"

describe("Get Round By Id Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Round By Id Admin",
        username: "test-get-round-by-id-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Round By Id Judge",
        username: "test-get-round-by-id-judge",
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

    const getRoundById = (cookieHeader: string, csrfToken: string, id: number | string) =>
        app.request(`/rounds/${id}`, {
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

    const seedRound = async (data: { name: string; phaseOrder: number; contestantLimit: number | null }) => {
        return prisma.round.create({
            data,
            select: {
                id: true,
                name: true,
                phaseOrder: true,
                contestantLimit: true,
            },
        })
    }

    const seedRoundWithContestants = async () => {
        const round = await seedRound({
            name: "Top 10",
            phaseOrder: 2,
            contestantLimit: 10,
        })

        const contestant = await prisma.contestant.create({
            data: {
                candidateNumber: 1,
                name: "Test Contestant",
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            },
        })

        await prisma.roundContestant.create({
            data: {
                roundId: round.id,
                contestantId: contestant.id,
            },
        })

        return round
    }

    beforeEach(async () => {
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username],
                },
            },
        })
    })

    afterAll(async () => {
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username],
                },
            },
        })
        await prisma.$disconnect()
    })

    describe("authenticate", () => {
        it("should return 401 Unauthorized if no credentials are provided", async () => {
            const res = await app.request("/rounds/1", {
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get a round", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })

            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getRoundById(cookieHeader, csrfToken, round.id)
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
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getRoundById(cookieHeader, csrfToken, id)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
        })
    })

    describe("happy path", () => {
        it("should return round details with isLimitLocked false when no contestants have advanced", async () => {
            const round = await seedRound({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getRoundById(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetRoundByIdResponse
            expect(json.message).toBe("Round retrieved successfully")
            expect(json.data).toEqual({
                id: round.id,
                phaseOrder: 2,
                name: "Top 10",
                contestantLimit: 10,
                isLimitLocked: false,
            })
        })

        it("should return isLimitLocked true when contestants have advanced into the round", async () => {
            const round = await seedRoundWithContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getRoundById(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetRoundByIdResponse
            expect(json.data.isLimitLocked).toBe(true)
        })

        it("should return isLimitLocked false for the preliminary round with no contestants", async () => {
            const round = await seedRound({
                name: "Preliminary",
                phaseOrder: 1,
                contestantLimit: null,
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getRoundById(cookieHeader, csrfToken, round.id)
            expect(res.status).toBe(200)

            const json = await res.json() as GetRoundByIdResponse
            expect(json.data).toEqual({
                id: round.id,
                phaseOrder: 1,
                name: "Preliminary",
                contestantLimit: null,
                isLimitLocked: false,
            })
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NOT_FOUND when the round does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getRoundById(cookieHeader, csrfToken, 99999)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("ROUND_PHASE_NOT_FOUND")
        })
    })
})
