import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { AddRoundResponse } from "../types.js"

describe("Add Round Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Add Round Admin",
        username: "test-add-round-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Add Round Judge",
        username: "test-add-round-judge",
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

    const postAddRound = async (
        cookieHeader: string,
        csrfToken: string,
        body: Record<string, unknown>,
    ) => {
        return app.request("/rounds", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify(body),
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

    beforeEach(async () => {
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
            const res = await app.request("/rounds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Preliminary",
                    phaseOrder: 1,
                }),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to add a round", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Preliminary",
                phaseOrder: 1,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should create the preliminary round with unlimited contestant limit", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Preliminary",
                phaseOrder: 1,
                contestantLimit: 10,
            })
            expect(res.status).toBe(201)

            const json = await res.json() as AddRoundResponse
            expect(json.message).toBe("Round added successfully")

            const round = await prisma.round.findUnique({
                where: { phaseOrder: 1 },
                select: {
                    name: true,
                    phaseOrder: true,
                    contestantLimit: true,
                },
            })
            expect(round).toEqual({
                name: "Preliminary",
                phaseOrder: 1,
                contestantLimit: null,
            })
        })

        it("should create a subsequent round with a contestant limit after preliminary exists", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddRound(cookieHeader, csrfToken, {
                name: "Preliminary",
                phaseOrder: 1,
            })

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            expect(res.status).toBe(201)

            const round = await prisma.round.findUnique({
                where: { phaseOrder: 2 },
                select: {
                    name: true,
                    phaseOrder: true,
                    contestantLimit: true,
                },
            })
            expect(round).toEqual({
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "round name is empty",
                body: {
                    name: "",
                    phaseOrder: 1,
                },
                code: "ROUND_NAME_INVALID",
            },
            {
                testCase: "phase order is zero",
                body: {
                    name: "Preliminary",
                    phaseOrder: 0,
                },
                code: "ROUND_PHASE_ORDER_INVALID",
            },
            {
                testCase: "contestant limit is not a positive integer",
                body: {
                    name: "Top 10",
                    phaseOrder: 2,
                    contestantLimit: -5,
                },
                code: "ROUND_CONTESTANT_LIMIT_INVALID",
            },
        ])("should return $code if $testCase", async ({ body, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddRound(cookieHeader, csrfToken, body)
            const json = await res.json() as { error: { code: string } }

            expect(json.error.code).toBe(code)
        })
    })

    describe("service failure", () => {
        it("should return ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS when creating a later round first", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS")
        })

        it("should return ROUND_CONTESTANT_LIMIT_REQUIRED for a later round without a limit", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddRound(cookieHeader, csrfToken, {
                name: "Preliminary",
                phaseOrder: 1,
            })

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Top 10",
                phaseOrder: 2,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_CONTESTANT_LIMIT_REQUIRED")
        })

        it("should return ROUND_PHASE_ORDER_ALREADY_EXISTS when creating a second preliminary round", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddRound(cookieHeader, csrfToken, {
                name: "Preliminary",
                phaseOrder: 1,
            })

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Another Preliminary",
                phaseOrder: 1,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_PHASE_ORDER_ALREADY_EXISTS")
        })

        it("should return ROUND_PHASE_ORDER_DUPLICATE when phase order already exists", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddRound(cookieHeader, csrfToken, {
                name: "Preliminary",
                phaseOrder: 1,
            })
            await postAddRound(cookieHeader, csrfToken, {
                name: "Top 10",
                phaseOrder: 2,
                contestantLimit: 10,
            })

            const res = await postAddRound(cookieHeader, csrfToken, {
                name: "Duplicate Top 10",
                phaseOrder: 2,
                contestantLimit: 5,
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("ROUND_PHASE_ORDER_DUPLICATE")
        })
    })
})
