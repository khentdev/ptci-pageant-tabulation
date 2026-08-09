import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetRoundsListResponse } from "../types.js"

describe("Get Rounds List Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Rounds List Admin",
        username: "test-get-rounds-list-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Rounds List Judge",
        username: "test-get-rounds-list-judge",
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

    const getRoundsList = (cookieHeader: string, csrfToken: string) =>
        app.request("/rounds", {
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

    const seedRoundsWithGappedPhaseOrder = async () => {
        await prisma.round.createMany({
            data: [
                { name: "Final", phaseOrder: 10, contestantLimit: 3 },
                { name: "Preliminary", phaseOrder: 1, contestantLimit: null },
                { name: "Top 10", phaseOrder: 5, contestantLimit: 10 },
            ],
        })
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
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get the rounds list", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getRoundsList(cookieHeader, csrfToken)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return an empty list when no rounds exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getRoundsList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetRoundsListResponse
            expect(json.message).toBe("Rounds list retrieved successfully")
            expect(json.data).toEqual([])
        })

        it("should return rounds ordered by phase order ascending regardless of insertion order", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()
            await seedRoundsWithGappedPhaseOrder()

            const res = await getRoundsList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetRoundsListResponse
            expect(json.message).toBe("Rounds list retrieved successfully")
            expect(json.data.map((round) => round.phaseOrder)).toEqual([1, 5, 10])
            expect(json.data).toEqual([
                {
                    id: expect.any(Number),
                    phaseOrder: 1,
                    name: "Preliminary",
                    contestantLimit: null,
                },
                {
                    id: expect.any(Number),
                    phaseOrder: 5,
                    name: "Top 10",
                    contestantLimit: 10,
                },
                {
                    id: expect.any(Number),
                    phaseOrder: 10,
                    name: "Final",
                    contestantLimit: 3,
                },
            ])
        })
    })
})
