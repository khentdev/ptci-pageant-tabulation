import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { LoginInputRequestBody } from "../../auth/types.js"

describe("Logout Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_USER = {
        name: "Logout Test User",
        username: "test-logout-user",
        role: "ADMIN" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const postLogin = (
        overrides?: LoginInputRequestBody | Record<string, unknown>,
        deviceId?: string,
    ) =>
        app.request("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fingerprint": deviceId ?? deviceFingerprint,
            },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: TEST_PASSWORD,
                ...overrides,
            }),
        })

    const loginAndGetCredentials = async () => {
        const loginRes = await postLogin()
        expect(loginRes.status).toBe(200)

        const rawCookies = loginRes.headers.getSetCookie()
        const cookieHeader = rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")

        const csrfCookiePair = rawCookies.find((cookie) => cookie.startsWith("csrfToken="))
        const csrfToken = csrfCookiePair?.split(";")[0]!.replace("csrfToken=", "") ?? ""

        return { cookieHeader, csrfToken }
    }

    const postLogout = (cookieHeader: string, csrfToken: string, deviceId?: string) =>
        app.request("/session/logout", {
            method: "DELETE",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceId ?? deviceFingerprint,
            },
        })

    const seedUser = async () => {
        const hashedPassword = await argon2.hash(TEST_PASSWORD)
        return prisma.user.create({
            data: {
                name: TEST_USER.name,
                username: TEST_USER.username,
                hashedPassword,
                role: TEST_USER.role,
            },
            select: {
                id: true,
                username: true,
            },
        })
    }

    beforeEach(async () => {
        await prisma.user.deleteMany({
            where: { username: TEST_USER.username },
        })
    })

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { username: TEST_USER.username },
        })
        await prisma.$disconnect()
    })

    describe("happy path", () => {
        it("should clear session cookies and return success message", async () => {
            await seedUser()
            const { cookieHeader, csrfToken } = await loginAndGetCredentials()

            const res = await postLogout(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as { message: string }
            expect(json.message).toBe("Logged out successfully.")

            const responseCookies = res.headers.getSetCookie()
            const sidCookie = responseCookies.find((cookie) => cookie.startsWith("sid="))
            const csrfCookie = responseCookies.find((cookie) => cookie.startsWith("csrfToken="))

            expect(sidCookie).toMatch(/Max-Age=0/i)
            expect(csrfCookie).toMatch(/Max-Age=0/i)
        })

        it("should reject session lookup when client has no cookies after logout", async () => {
            await seedUser()
            const { cookieHeader, csrfToken } = await loginAndGetCredentials()

            const logoutRes = await postLogout(cookieHeader, csrfToken)
            expect(logoutRes.status).toBe(200)

            const sessionRes = await app.request("/session/me", {
                method: "GET",
                headers: {
                    "X-Fingerprint": deviceFingerprint,
                },
            })
            const json = await sessionRes.json() as { error: { code: string } }

            expect(sessionRes.status).toBe(401)
            expect(json.error.code).toBe("SESSION_UNAUTHORIZED")
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "no session cookie",
                buildRequest: () => app.request("/session/logout", {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-Token": "some-csrf-token",
                        "X-Fingerprint": deviceFingerprint,
                    },
                }),
                expectedCode: "SESSION_UNAUTHORIZED",
                expectedStatus: 401,
            },
            {
                testCase: "mismatched CSRF token",
                buildRequest: async () => {
                    await seedUser()
                    const { cookieHeader } = await loginAndGetCredentials()
                    return app.request("/session/logout", {
                        method: "DELETE",
                        headers: {
                            "Cookie": cookieHeader,
                            "X-CSRF-Token": "this-does-not-match",
                            "X-Fingerprint": deviceFingerprint,
                        },
                    })
                },
                expectedCode: "SESSION_UNAUTHORIZED",
                expectedStatus: 401,
            },
        ])("should return $expectedCode if $testCase", async ({ buildRequest, expectedCode, expectedStatus }) => {
            const res = await buildRequest()
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(expectedStatus)
            expect(json.error.code).toBe(expectedCode)
        })
    })
})
