import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { AddJudgeResponse } from "../types.js"

describe("Add Judge Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Add Judge Admin",
        username: "test-add-judge-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Add Judge Judge",
        username: "test-add-judge-judge",
        role: "JUDGE" as Role,
    }
    const NEW_JUDGE = {
        name: "Judge One",
        username: "test-add-judge-new",
        password: "judgepass1",
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const validBody = {
        name: NEW_JUDGE.name,
        username: NEW_JUDGE.username,
        password: NEW_JUDGE.password,
    }

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        NEW_JUDGE.username,
        "test-add-judge-existing",
        "test-add-judge-boundary",
        "test-add-judge-whitespace",
        "test-add-judge-concurrent",
        "ann",
        "bob",
    ]

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

    const postAddJudge = async (
        cookieHeader: string,
        csrfToken: string,
        body: Record<string, unknown>,
    ) => {
        return app.request("/judges", {
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
            const res = await app.request("/judges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(validBody),
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to add a judge", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await postAddJudge(cookieHeader, csrfToken, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should create a judge with all required fields", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, validBody)
            expect(res.status).toBe(201)

            const json = await res.json() as AddJudgeResponse
            expect(json.message).toBe("Judge added successfully.")

            const judge = await prisma.user.findFirst({
                where: { username: NEW_JUDGE.username },
                select: {
                    name: true,
                    username: true,
                    role: true,
                    hashedPassword: true,
                },
            })
            expect(judge).toEqual({
                name: NEW_JUDGE.name,
                username: NEW_JUDGE.username,
                role: "JUDGE",
                hashedPassword: expect.any(String),
            })
            expect(judge?.hashedPassword).not.toBe(NEW_JUDGE.password)

            const passwordMatches = await argon2.verify(judge!.hashedPassword, NEW_JUDGE.password)
            expect(passwordMatches).toBe(true)
        })

        it("should allow multiple judges with different usernames", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const firstRes = await postAddJudge(cookieHeader, csrfToken, validBody)
            expect(firstRes.status).toBe(201)

            const secondRes = await postAddJudge(cookieHeader, csrfToken, {
                name: "Judge Two",
                username: "test-add-judge-existing",
                password: "judgepass2",
            })
            expect(secondRes.status).toBe(201)

            const judgeCount = await prisma.user.count({
                where: {
                    role: "JUDGE",
                    username: {
                        in: [NEW_JUDGE.username, "test-add-judge-existing"],
                    },
                },
            })
            expect(judgeCount).toBe(2)
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "name is too short",
                body: { ...validBody, name: "Jo" },
                code: "JUDGE_NAME_TOO_SHORT",
                field: "judge_name_input",
            },
            {
                testCase: "name is empty",
                body: { ...validBody, name: "" },
                code: "JUDGE_NAME_TOO_SHORT",
                field: "judge_name_input",
            },
            {
                testCase: "name is whitespace only",
                body: { ...validBody, name: "   " },
                code: "JUDGE_NAME_TOO_SHORT",
                field: "judge_name_input",
            },
            {
                testCase: "name is missing",
                body: {
                    username: validBody.username,
                    password: validBody.password,
                },
                code: "JUDGE_NAME_TOO_SHORT",
                field: "judge_name_input",
            },
            {
                testCase: "username is too short",
                body: { ...validBody, username: "ab" },
                code: "JUDGE_USERNAME_TOO_SHORT",
                field: "judge_username_input",
            },
            {
                testCase: "username is empty",
                body: { ...validBody, username: "" },
                code: "JUDGE_USERNAME_TOO_SHORT",
                field: "judge_username_input",
            },
            {
                testCase: "username is missing",
                body: {
                    name: validBody.name,
                    password: validBody.password,
                },
                code: "JUDGE_USERNAME_TOO_SHORT",
                field: "judge_username_input",
            },
            {
                testCase: "password is too short",
                body: { ...validBody, password: "short1" },
                code: "JUDGE_PASSWORD_TOO_SHORT",
                field: "judge_password_input",
            },
            {
                testCase: "password is empty",
                body: { ...validBody, password: "" },
                code: "JUDGE_PASSWORD_TOO_SHORT",
                field: "judge_password_input",
            },
            {
                testCase: "password is missing",
                body: {
                    name: validBody.name,
                    username: validBody.username,
                },
                code: "JUDGE_PASSWORD_TOO_SHORT",
                field: "judge_password_input",
            },
        ])("should return $code if $testCase", async ({ body, code, field }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, body)
            const json = await res.json() as { error: { code: string; field: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
            expect(json.error.message).toBeTruthy()
        })

        it("should reject a numeric name in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                ...validBody,
                name: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_NAME_TOO_SHORT")
            expect(json.error.field).toBe("judge_name_input")
        })

        it("should reject a numeric username in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                ...validBody,
                username: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_USERNAME_TOO_SHORT")
            expect(json.error.field).toBe("judge_username_input")
        })

        it("should reject a numeric password in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                ...validBody,
                password: 12345678,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_PASSWORD_TOO_SHORT")
            expect(json.error.field).toBe("judge_password_input")
        })

        it("should reject null values in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: null,
                username: validBody.username,
                password: validBody.password,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_NAME_TOO_SHORT")
            expect(json.error.field).toBe("judge_name_input")
        })

        it("should not create a judge when validation fails", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddJudge(cookieHeader, csrfToken, { ...validBody, name: "Jo" })

            const judgeCount = await prisma.user.count({
                where: { username: NEW_JUDGE.username },
            })
            expect(judgeCount).toBe(0)
        })
    })

    describe("business rules", () => {
        it("should return JUDGE_USERNAME_EXISTS when username already exists", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const firstRes = await postAddJudge(cookieHeader, csrfToken, validBody)
            expect(firstRes.status).toBe(201)

            const secondRes = await postAddJudge(cookieHeader, csrfToken, validBody)
            const json = await secondRes.json() as { error: { code: string; message: string } }

            expect(secondRes.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_USERNAME_EXISTS")
            expect(json.error.message).toBe("Username already exists.")
        })

        it("should return JUDGE_USERNAME_EXISTS when username matches an existing admin", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: "Duplicate Admin Username",
                username: TEST_ADMIN.username,
                password: "judgepass1",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_USERNAME_EXISTS")
        })

        it("should not create a judge when username is duplicate", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddJudge(cookieHeader, csrfToken, validBody)
            await postAddJudge(cookieHeader, csrfToken, validBody)

            const judgeCount = await prisma.user.count({
                where: { username: NEW_JUDGE.username },
            })
            expect(judgeCount).toBe(1)
        })
    })

    describe("boundary and whitespace behavior", () => {
        it("should accept values at exact minimum lengths", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: "Ann",
                username: "ann",
                password: "12345678",
            })
            expect(res.status).toBe(201)

            const judge = await prisma.user.findFirst({
                where: { username: "ann" },
                select: { name: true, role: true },
            })
            expect(judge).toEqual({
                name: "Ann",
                role: "JUDGE",
            })
        })

        it("should reject values one character below minimum lengths", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: "An",
                username: "an",
                password: "1234567",
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_NAME_TOO_SHORT")
            expect(json.error.field).toBe("judge_name_input")
        })

        it("should trim name and username before saving", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: "  Bob  ",
                username: "  bob  ",
                password: "  password1  ",
            })
            expect(res.status).toBe(201)

            const judge = await prisma.user.findFirst({
                where: { username: "bob" },
                select: { name: true, username: true, hashedPassword: true },
            })
            expect(judge).toEqual({
                name: "Bob",
                username: "bob",
                hashedPassword: expect.any(String),
            })

            const passwordMatches = await argon2.verify(judge!.hashedPassword, "  password1  ")
            expect(passwordMatches).toBe(true)
        })

        it("should accept padded name and username when trimmed length meets minimum", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: "  Ann  ",
                username: "  ann  ",
                password: "12345678",
            })
            expect(res.status).toBe(201)

            const judge = await prisma.user.findFirst({
                where: { username: "ann" },
                select: { name: true, username: true },
            })
            expect(judge).toEqual({
                name: "Ann",
                username: "ann",
            })
        })

        it("should reject a password that is only whitespace even when raw length meets minimum", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                name: "Whitespace Judge",
                username: "test-add-judge-whitespace",
                password: "        ",
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("JUDGE_PASSWORD_TOO_SHORT")
            expect(json.error.field).toBe("judge_password_input")
        })
    })

    describe("non-obvious behavior", () => {
        it("should handle concurrent duplicate username submissions with one success", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const concurrentBody = {
                name: "Concurrent Judge",
                username: "test-add-judge-concurrent",
                password: "judgepass1",
            }

            const [firstRes, secondRes] = await Promise.all([
                postAddJudge(cookieHeader, csrfToken, concurrentBody),
                postAddJudge(cookieHeader, csrfToken, concurrentBody),
            ])

            const statuses = [firstRes.status, secondRes.status].sort()
            expect(statuses[0]).toBe(201)
            expect([400, 500]).toContain(statuses[1])

            const failedRes = firstRes.status === 201 ? secondRes : firstRes
            const failedJson = await failedRes.json() as { error: { code: string } }
            expect(["JUDGE_USERNAME_EXISTS", "JUDGE_ADD_FAILED"]).toContain(failedJson.error.code)

            const judgeCount = await prisma.user.count({
                where: { username: "test-add-judge-concurrent" },
            })
            expect(judgeCount).toBe(1)
        })

        it("should return consistent error shape for validation failures", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddJudge(cookieHeader, csrfToken, {
                ...validBody,
                password: "short",
            })
            const json = await res.json() as {
                error: {
                    message: string
                    code: string
                    field: string
                }
            }

            expect(res.status).toBe(400)
            expect(json.error).toEqual({
                message: "Password must be at least 8 characters long.",
                code: "JUDGE_PASSWORD_TOO_SHORT",
                field: "judge_password_input",
            })
        })

        it("should return consistent error shape for duplicate username failures", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddJudge(cookieHeader, csrfToken, validBody)

            const res = await postAddJudge(cookieHeader, csrfToken, validBody)
            const json = await res.json() as {
                error: {
                    message: string
                    code: string
                }
            }

            expect(res.status).toBe(400)
            expect(json.error.message).toBe("Username already exists.")
            expect(json.error.code).toBe("JUDGE_USERNAME_EXISTS")
        })
    })
})
