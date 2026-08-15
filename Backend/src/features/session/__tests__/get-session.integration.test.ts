import * as argon2 from "argon2"
import { sign } from "hono/jwt"
import { serializeSigned } from "hono/utils/cookie"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { env } from "../../../configs/env.js"
import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"
import { hashData } from "../../../lib/hash.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { LoginInputRequestBody } from "../../auth/types.js"

describe("Get Session Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_USER = {
        name: "Session Test User",
        username: "test-session-user",
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

    const getSession = (cookieHeader: string, csrfToken: string, deviceId?: string) =>
        app.request("/session/me", {
            method: "GET",
            headers: {
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceId ?? deviceFingerprint,
            },
        })

    const buildSignedSessionCookieStr = async (token: string): Promise<string> =>
        serializeSigned("sid", token, env.COOKIE_SECRET)

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
                name: true,
                username: true,
                role: true,
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
        it("should return user data without rotating tokens when the session token is not nearing expiration", async () => {
            const user = await seedUser()
            const { cookieHeader, csrfToken } = await loginAndGetCredentials()

            const res = await getSession(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as { user: Record<string, unknown> }
            expect(json.user).toEqual({
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
            })

            const responseCookies = res.headers.getSetCookie()
            expect(responseCookies.find((cookie) => cookie.startsWith("sid="))).toBeUndefined()
            expect(responseCookies.find((cookie) => cookie.startsWith("csrfToken="))).toBeUndefined()
        })

        it("should return user data and rotate tokens when the session token is near expiration", async () => {
            const user = await seedUser()

            const now = Math.floor(Date.now() / 1000)
            const nearExpiryToken = await sign({
                sub: user.id,
                role: TEST_USER.role,
                deviceHash: hashData(deviceFingerprint),
                iat: now,
                exp: now + 1800,
                iss: env.JWT_ISSUER,
                nonce: "test1234",
            }, env.JWT_SECRET, "HS512")

            const csrfToken = "test-csrf-token"
            const signedSidCookieStr = await buildSignedSessionCookieStr(nearExpiryToken)

            const res = await app.request("/session/me", {
                method: "GET",
                headers: {
                    "Cookie": `${signedSidCookieStr}; csrfToken=${csrfToken}`,
                    "X-CSRF-Token": csrfToken,
                    "X-Fingerprint": deviceFingerprint,
                },
            })

            expect(res.status).toBe(200)

            const json = await res.json() as { user: { id: number } }
            expect(json.user.id).toBe(user.id)

            const responseCookies = res.headers.getSetCookie()
            expect(responseCookies.find((cookie) => cookie.startsWith("sid="))).toBeDefined()
            expect(responseCookies.find((cookie) => cookie.startsWith("csrfToken="))).toBeDefined()
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "no session cookie",
                buildRequest: () => app.request("/session/me", {
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "some-csrf-token",
                        "X-Fingerprint": deviceFingerprint,
                    },
                }),
                expectedCode: "SESSION_UNAUTHORIZED",
                expectedStatus: 401,
            },
            {
                testCase: "no X-CSRF-Token header",
                buildRequest: async () => {
                    await seedUser()
                    const { cookieHeader } = await loginAndGetCredentials()
                    return app.request("/session/me", {
                        method: "GET",
                        headers: {
                            "Cookie": cookieHeader,
                            "X-Fingerprint": deviceFingerprint,
                        },
                    })
                },
                expectedCode: "SESSION_UNAUTHORIZED",
                expectedStatus: 401,
            },
            {
                testCase: "no csrfToken cookie",
                buildRequest: async () => {
                    await seedUser()
                    const { cookieHeader, csrfToken } = await loginAndGetCredentials()
                    const sidOnlyCookie = cookieHeader
                        .split("; ")
                        .filter((cookie) => cookie.startsWith("sid="))
                        .join("; ")
                    return app.request("/session/me", {
                        method: "GET",
                        headers: {
                            "Cookie": sidOnlyCookie,
                            "X-CSRF-Token": csrfToken,
                            "X-Fingerprint": deviceFingerprint,
                        },
                    })
                },
                expectedCode: "SESSION_UNAUTHORIZED",
                expectedStatus: 401,
            },
            {
                testCase: "mismatched CSRF token",
                buildRequest: async () => {
                    await seedUser()
                    const { cookieHeader } = await loginAndGetCredentials()
                    return app.request("/session/me", {
                        method: "GET",
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
            {
                testCase: "invalid device fingerprint",
                buildRequest: async () => {
                    await seedUser()
                    const { cookieHeader, csrfToken } = await loginAndGetCredentials()
                    return app.request("/session/me", {
                        method: "GET",
                        headers: {
                            "Cookie": cookieHeader,
                            "X-CSRF-Token": csrfToken,
                            "X-Fingerprint": "[123xyz]{invalid}",
                        },
                    })
                },
                expectedCode: "INVALID_DEVICE_ID",
                expectedStatus: 400,
            },
            {
                testCase: "fingerprint does not match session token",
                buildRequest: async () => {
                    await seedUser()
                    const { cookieHeader, csrfToken } = await loginAndGetCredentials()
                    const differentFingerprint = "{\"userAgent\":\"Different/1.0\",\"language\":\"en-US\",\"platform\":\"Linux\",\"screen\":{\"width\":1280,\"height\":720,\"colorDepth\":24},\"timezone\":\"UTC\",\"hardwareConcurrency\":4,\"deviceMemory\":8,\"touchSupport\":false,\"canvas\":\"aabbccdd\",\"webgl\":\"Mesa\"}"
                    return app.request("/session/me", {
                        method: "GET",
                        headers: {
                            "Cookie": cookieHeader,
                            "X-CSRF-Token": csrfToken,
                            "X-Fingerprint": differentFingerprint,
                        },
                    })
                },
                expectedCode: "SESSION_UNAUTHORIZED",
                expectedStatus: 401,
            },
            {
                testCase: "session token is expired",
                buildRequest: async () => {
                    const user = await seedUser()
                    const now = Math.floor(Date.now() / 1000)
                    const expiredToken = await sign({
                        sub: user.id,
                        role: TEST_USER.role,
                        deviceHash: hashData(deviceFingerprint),
                        iat: now - 7200,
                        exp: now - 3600,
                        iss: env.JWT_ISSUER,
                        nonce: "expired1",
                    }, env.JWT_SECRET, "HS512")

                    const csrfToken = "test-csrf-token"
                    const signedSidCookieStr = await buildSignedSessionCookieStr(expiredToken)

                    return app.request("/session/me", {
                        method: "GET",
                        headers: {
                            "Cookie": `${signedSidCookieStr}; csrfToken=${csrfToken}`,
                            "X-CSRF-Token": csrfToken,
                            "X-Fingerprint": deviceFingerprint,
                        },
                    })
                },
                expectedCode: "TOKEN_EXPIRED",
                expectedStatus: 401,
            },
        ])("should return $expectedCode if $testCase", async ({ buildRequest, expectedCode, expectedStatus }) => {
            const res = await buildRequest()
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(expectedStatus)
            expect(json.error.code).toBe(expectedCode)
        })
    })

    describe("service failure", () => {
        it("should return SESSION_UNAUTHORIZED if user no longer exists in the database", async () => {
            await seedUser()
            const { cookieHeader, csrfToken } = await loginAndGetCredentials()

            await prisma.user.deleteMany({
                where: { username: TEST_USER.username },
            })

            const res = await getSession(cookieHeader, csrfToken)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(401)
            expect(json.error.code).toBe("SESSION_UNAUTHORIZED")
        })
    })
})
