import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { LoginInputRequestBody } from "../types.js"
import type { Role } from "../../../../generated/prisma/enums.js"
import type { LoginResponse } from "../types.js"

describe("Login Integration Test", () => {
    const app = createHonoApp()
    const TEST_PASSWORD = "password123123123"
    const TEST_USER = {
        name: "Test Admin",
        username: "test-login-admin",
        role: "ADMIN" as Role,
    }
    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const postLogin = async (
        body: LoginInputRequestBody | Record<string, unknown>,
        deviceId?: string,
    ) => {
        return app.request("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fingerprint": deviceId ?? deviceFingerprint,
            },
            body: JSON.stringify(body),
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
        it("should login user, set session cookies and return user to client", async () => {
            const hashedPassword = await argon2.hash(TEST_PASSWORD)
            const user = await prisma.user.create({
                data: {
                    name: TEST_USER.name,
                    username: TEST_USER.username,
                    hashedPassword,
                    role: TEST_USER.role,
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                },
            })

            const loginRes = await postLogin({
                username: TEST_USER.username,
                password: TEST_PASSWORD,
            })
            expect(loginRes.status).toBe(200)

            const json = await loginRes.json() as LoginResponse
            expect(json.message).toBe("Logged in successfully")
            expect(json.data.user).toEqual({
                id: user.id,
                username: user.username,
                role: user.role,
            })

            const cookies = loginRes.headers.getSetCookie()
            expect(cookies.some((cookie) => cookie.startsWith("sid="))).toBe(true)
            expect(cookies.some((cookie) => cookie.startsWith("csrfToken="))).toBe(true)
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "username is empty",
                body: {
                    username: "",
                    password: TEST_PASSWORD,
                },
                deviceId: deviceFingerprint,
                code: "INVALID_USERNAME",
            },
            {
                testCase: "password is empty",
                body: {
                    username: TEST_USER.username,
                    password: "",
                },
                deviceId: deviceFingerprint,
                code: "INVALID_PASSWORD",
            },
            {
                testCase: "invalid device fingerprint",
                body: {
                    username: TEST_USER.username,
                    password: TEST_PASSWORD,
                },
                deviceId: "[][1}11q",
                code: "INVALID_DEVICE_ID",
            },
        ])("return $code if $testCase", async ({ body, deviceId, code }) => {
            const res = await postLogin(body, deviceId)
            const json = await res.json() as { error: { code: string } }

            expect(json.error.code).toBe(code)
        })
    })

    describe("service failure", () => {
        it("should return INVALID_CREDENTIALS if user not found", async () => {
            const res = await postLogin({
                username: "nonexistent-user",
                password: TEST_PASSWORD,
            })
            expect(res.status).toBe(401)

            const json = await res.json() as { error: { code: string } }
            expect(json.error.code).toBe("INVALID_CREDENTIALS")
        })

        it("should return INVALID_CREDENTIALS if password does not match", async () => {
            const hashedPassword = await argon2.hash(TEST_PASSWORD)
            await prisma.user.create({
                data: {
                    name: TEST_USER.name,
                    username: TEST_USER.username,
                    hashedPassword,
                    role: TEST_USER.role,
                },
            })

            const res = await postLogin({
                username: TEST_USER.username,
                password: "wrong-password",
            })
            expect(res.status).toBe(401)

            const json = await res.json() as { error: { code: string } }
            expect(json.error.code).toBe("INVALID_CREDENTIALS")
        })
    })
})
