import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetJudgeListResponse } from "../types.js"

describe("Get Judge List Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get Judge List Admin",
        username: "test-get-judge-list-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get Judge List Judge",
        username: "test-get-judge-list-judge",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_ONE = {
        name: "Judge One",
        username: "test-get-judge-list-judge-1",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_TWO = {
        name: "Judge Two",
        username: "test-get-judge-list-judge-2",
        role: "JUDGE" as Role,
    }
    const TEST_JUDGE_THREE = {
        name: "Judge Three",
        username: "test-get-judge-list-judge-3",
        role: "JUDGE" as Role,
    }

    const testUsernames = [
        TEST_ADMIN.username,
        TEST_JUDGE.username,
        TEST_JUDGE_ONE.username,
        TEST_JUDGE_TWO.username,
        TEST_JUDGE_THREE.username,
    ]

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

    const getJudgeList = (cookieHeader: string, csrfToken: string) =>
        app.request("/judges", {
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
                name: true,
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
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get the judge list", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getJudgeList(cookieHeader, csrfToken)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return an empty list when no judges exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            expect(json.message).toBe("Judge list fetched successfully.")
            expect(json.data).toEqual([])
        })

        it("should return a single judge with correct DTO shape", async () => {
            const judge = await seedUser(TEST_JUDGE_ONE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            expect(json.data).toEqual([
                {
                    id: judge.id,
                    name: TEST_JUDGE_ONE.name,
                    username: TEST_JUDGE_ONE.username,
                },
            ])
        })

        it("should return multiple judges", async () => {
            const judgeOne = await seedUser(TEST_JUDGE_ONE)
            const judgeTwo = await seedUser(TEST_JUDGE_TWO)
            const judgeThree = await seedUser(TEST_JUDGE_THREE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            expect(json.data).toHaveLength(3)
            expect(json.data).toEqual(
                expect.arrayContaining([
                    {
                        id: judgeOne.id,
                        name: TEST_JUDGE_ONE.name,
                        username: TEST_JUDGE_ONE.username,
                    },
                    {
                        id: judgeTwo.id,
                        name: TEST_JUDGE_TWO.name,
                        username: TEST_JUDGE_TWO.username,
                    },
                    {
                        id: judgeThree.id,
                        name: TEST_JUDGE_THREE.name,
                        username: TEST_JUDGE_THREE.username,
                    },
                ]),
            )
        })

        it("should not include admin users in the list", async () => {
            await seedUser(TEST_JUDGE_ONE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            expect(json.data).toHaveLength(1)
            expect(json.data[0]!.username).toBe(TEST_JUDGE_ONE.username)
            expect(json.data.some((judge) => judge.username === TEST_ADMIN.username)).toBe(false)
        })
    })

    describe("edge cases", () => {
        it("should return an empty list when only admin users exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            expect(json.data).toEqual([])
        })

        it("should not include the authenticated admin in the list", async () => {
            await seedUser(TEST_JUDGE_ONE)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            expect(json.data.some((judge) => judge.username === TEST_ADMIN.username)).toBe(false)
        })
    })

    describe("non-obvious behavior", () => {
        it("should not expose hashedPassword in any list entry", async () => {
            await seedUser(TEST_JUDGE_ONE)
            await seedUser(TEST_JUDGE_TWO)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            for (const entry of json.data) {
                expect("hashedPassword" in entry).toBe(false)
            }
        })

        it("should not expose role in any list entry", async () => {
            await seedUser(TEST_JUDGE_ONE)
            await seedUser(TEST_JUDGE_TWO)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            for (const entry of json.data) {
                expect("role" in entry).toBe(false)
            }
        })

        it("should not expose createdAt in any list entry", async () => {
            await seedUser(TEST_JUDGE_ONE)
            await seedUser(TEST_JUDGE_TWO)
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getJudgeList(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetJudgeListResponse
            for (const entry of json.data) {
                expect("createdAt" in entry).toBe(false)
            }
        })
    })
})
