import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { ResetJudgePasswordResponse } from "../types.js"

describe("Reset Judge Password Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const NEW_PASSWORD = "newjudgepass1"
    const TEST_ADMIN = {
        name: "Reset Judge Admin",
        username: "test-reset-judge-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Reset Judge Judge",
        username: "test-reset-judge-judge",
        role: "JUDGE" as Role,
    }
    const TARGET_JUDGE = {
        name: "Judge One",
        username: "test-reset-judge-target",
        role: "JUDGE" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const validBody = {
        password: NEW_PASSWORD,
    }

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        TARGET_JUDGE.username,
    ]

    const postLogin = (username: string, password: string = TEST_PASSWORD) =>
        app.request("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify({
                username,
                password,
            }),
        })

    const loginAndGetCredentials = async (username: string, password: string = TEST_PASSWORD) => {
        const loginRes = await postLogin(username, password)
        expect(loginRes.status).toBe(200)

        const rawCookies = loginRes.headers.getSetCookie()
        const cookieHeader = rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")

        const csrfCookiePair = rawCookies.find((cookie) => cookie.startsWith("csrfToken="))
        const csrfToken = csrfCookiePair?.split(";")[0]!.replace("csrfToken=", "") ?? ""

        return { cookieHeader, csrfToken }
    }

    const patchResetJudgePassword = async (
        cookieHeader: string,
        csrfToken: string,
        id: number | string,
        body: Record<string, unknown>,
    ) => {
        return app.request(`/judges/${id}/password`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookieHeader,
                "X-CSRF-Token": csrfToken,
                "X-Fingerprint": deviceFingerprint,
            },
            body: JSON.stringify(body),
        })
    }

    const getSession = (cookieHeader: string, csrfToken: string) =>
        app.request("/session/me", {
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
                hashedPassword: true,
            },
        })
    }

    const seedAdminCredentials = async () => {
        await seedUser(TEST_ADMIN)
        return loginAndGetCredentials(TEST_ADMIN.username)
    }

    const cleanupTestUsers = async () => {
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: testUsernames,
                },
            },
        })
    }

    beforeEach(async () => {
        await cleanupTestUsers()
    })

    afterAll(async () => {
        await cleanupTestUsers()
        await prisma.$disconnect()
    })

    describe("authenticate", () => {
        it("should return 401 Unauthorized if no credentials are provided", async () => {
            const res = await app.request("/judges/1/password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(validBody),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to reset another judge password", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await patchResetJudgePassword(cookieHeader, csrfToken, targetJudge.id, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should reset judge password and verify new password works", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchResetJudgePassword(cookieHeader, csrfToken, targetJudge.id, validBody)
            const json = await res.json() as ResetJudgePasswordResponse

            expect(res.status).toBe(200)
            expect(json.message).toBe("Judge password reset successfully.")

            const updatedJudge = await prisma.user.findUnique({
                where: { id: targetJudge.id },
                select: { hashedPassword: true },
            })

            const newPasswordMatches = await argon2.verify(updatedJudge!.hashedPassword, NEW_PASSWORD)
            expect(newPasswordMatches).toBe(true)

            const oldPasswordMatches = await argon2.verify(updatedJudge!.hashedPassword, TEST_PASSWORD)
            expect(oldPasswordMatches).toBe(false)

            const loginRes = await postLogin(TARGET_JUDGE.username, NEW_PASSWORD)
            expect(loginRes.status).toBe(200)
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "judge id is not a number",
                id: "abc",
                code: "JUDGE_ID_INVALID",
            },
            {
                testCase: "judge id is zero",
                id: "0",
                code: "JUDGE_ID_INVALID",
            },
            {
                testCase: "judge id is negative",
                id: "-1",
                code: "JUDGE_ID_INVALID",
            },
            {
                testCase: "judge id is not an integer",
                id: "1.5",
                code: "JUDGE_ID_INVALID",
            },
        ])("should return $code if $testCase", async ({ id, code }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchResetJudgePassword(cookieHeader, csrfToken, id, validBody)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe("reset_judge_password_input_id")
        })

        it("should return JUDGE_PASSWORD_TOO_SHORT when password is too short", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchResetJudgePassword(cookieHeader, csrfToken, targetJudge.id, {
                password: "short1",
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_PASSWORD_TOO_SHORT")
            expect(json.error.field).toBe("judge_password_input")
        })
    })

    describe("business rules", () => {
        it("should return JUDGE_NOT_FOUND when the judge does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchResetJudgePassword(cookieHeader, csrfToken, 99999, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })

        it("should return JUDGE_NOT_FOUND when the id belongs to an admin", async () => {
            const admin = await seedUser(TEST_ADMIN)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_ADMIN.username)

            const res = await patchResetJudgePassword(cookieHeader, csrfToken, admin.id, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("JUDGE_NOT_FOUND")
        })
    })

    describe("session", () => {
        it("should keep the judge session valid after password reset", async () => {
            const targetJudge = await seedUser(TARGET_JUDGE)
            const judgeCredentials = await loginAndGetCredentials(TARGET_JUDGE.username)
            const { cookieHeader: adminCookie, csrfToken: adminCsrf } = await seedAdminCredentials()

            const resetRes = await patchResetJudgePassword(adminCookie, adminCsrf, targetJudge.id, validBody)
            expect(resetRes.status).toBe(200)

            const sessionRes = await getSession(judgeCredentials.cookieHeader, judgeCredentials.csrfToken)
            expect(sessionRes.status).toBe(200)

            const sessionJson = await sessionRes.json() as { user: { username: string; role: string } }
            expect(sessionJson.user.username).toBe(TARGET_JUDGE.username)
            expect(sessionJson.user.role).toBe("JUDGE")
        })
    })
})
