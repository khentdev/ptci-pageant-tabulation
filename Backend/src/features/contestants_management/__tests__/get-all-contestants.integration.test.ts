import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { GetAllContestantsResponse } from "../types.js"

describe("Get All Contestants Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Get All Contestants Admin",
        username: "test-get-all-contestants-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Get All Contestants Judge",
        username: "test-get-all-contestants-judge",
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

    const getAllContestants = (cookieHeader: string, csrfToken: string, query = "") =>
        app.request(`/contestants${query}`, {
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

    const seedContestant = async (data: {
        candidateNumber: number
        name: string
        gender: "MALE" | "FEMALE"
        teamName: string
        teamColor: string
    }) => {
        return prisma.contestant.create({
            data,
            select: { id: true, candidateNumber: true },
        })
    }

    const seedMixedContestants = async () => {
        await seedContestant({
            candidateNumber: 3,
            name: "Dela Cruz, Christine",
            gender: "FEMALE",
            teamName: "Purple Team",
            teamColor: "Purple",
        })
        await seedContestant({
            candidateNumber: 1,
            name: "Aniar, Andrea Mae",
            gender: "FEMALE",
            teamName: "Yellow Team",
            teamColor: "Yellow",
        })
        await seedContestant({
            candidateNumber: 2,
            name: "Santos, Juan",
            gender: "MALE",
            teamName: "Blue Team",
            teamColor: "Blue",
        })
    }

    const expectedMixedContestants = [
        {
            candidateNumber: 1,
            name: "Aniar, Andrea Mae",
            gender: "FEMALE",
            teamName: "Yellow Team",
            teamColor: "Yellow",
        },
        {
            candidateNumber: 2,
            name: "Santos, Juan",
            gender: "MALE",
            teamName: "Blue Team",
            teamColor: "Blue",
        },
        {
            candidateNumber: 3,
            name: "Dela Cruz, Christine",
            gender: "FEMALE",
            teamName: "Purple Team",
            teamColor: "Purple",
        },
    ]

    beforeEach(async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username],
                },
            },
        })
    })

    afterAll(async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.contestant.deleteMany()
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
            const res = await app.request("/contestants", {
                method: "GET",
            })

            expect(res.status).toBe(401)
        })
    })

    describe("authorization", () => {
        it("should return 403 Forbidden if a judge attempts to get all contestants", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await getAllContestants(cookieHeader, csrfToken)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should return an empty list when no contestants exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.message).toBe("Contestants fetched successfully")
            expect(json.data).toEqual([])
        })

        it("should return all contestants when no filter is provided", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toEqual(expectedMixedContestants)
        })

        it("should return only male contestants when filter is MALE", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, "?filter=MALE")
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toEqual([
                {
                    candidateNumber: 2,
                    name: "Santos, Juan",
                    gender: "MALE",
                    teamName: "Blue Team",
                    teamColor: "Blue",
                },
            ])
        })

        it("should return only female contestants when filter is FEMALE", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, "?filter=FEMALE")
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toEqual([
                {
                    candidateNumber: 1,
                    name: "Aniar, Andrea Mae",
                    gender: "FEMALE",
                    teamName: "Yellow Team",
                    teamColor: "Yellow",
                },
                {
                    candidateNumber: 3,
                    name: "Dela Cruz, Christine",
                    gender: "FEMALE",
                    teamName: "Purple Team",
                    teamColor: "Purple",
                },
            ])
        })

        it("should normalize lowercase filter values", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, "?filter=female")
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toHaveLength(2)
            expect(json.data.every((contestant) => contestant.gender === "FEMALE")).toBe(true)
        })

        it("should normalize mixed-case filter values", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, "?filter=Male")
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toHaveLength(1)
            expect(json.data[0]!.gender).toBe("MALE")
        })

        it("should return contestants ordered by candidate number ascending regardless of insertion order", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data.map((contestant) => contestant.candidateNumber)).toEqual([1, 2, 3])
        })

        it("should return only public fields and exclude internal database id", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken)
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data[0]).toEqual({
                candidateNumber: expect.any(Number),
                name: expect.any(String),
                gender: expect.any(String),
                teamName: expect.any(String),
                teamColor: expect.any(String),
            })
            expect(json.data[0]).not.toHaveProperty("id")
        })

        it("should return an empty array when filter matches no contestants", async () => {
            await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, "?filter=MALE")
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toEqual([])
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "filter is an invalid string",
                query: "?filter=OTHER",
            },
            {
                testCase: "filter is numeric-like",
                query: "?filter=123",
            },
        ])("should return CONTESTANT_FILTER_INVALID if $testCase", async ({ query }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, query)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_FILTER_INVALID")
            expect(json.error.field).toBe("get_all_contestants_params_filter")
        })

        it.each([
            {
                testCase: "filter is empty",
                query: "?filter=",
            },
            {
                testCase: "filter is whitespace only",
                query: "?filter=%20%20",
            },
        ])("should return all contestants when $testCase", async ({ query }) => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, query)
            expect(res.status).toBe(200)

            const json = await res.json() as GetAllContestantsResponse
            expect(json.data).toEqual(expectedMixedContestants)
        })
    })

    describe("non-obvious cases", () => {
        it("should return identical results when filter is omitted versus empty", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const noFilterRes = await getAllContestants(cookieHeader, csrfToken)
            const emptyFilterRes = await getAllContestants(cookieHeader, csrfToken, "?filter=")

            const noFilterJson = await noFilterRes.json() as GetAllContestantsResponse
            const emptyFilterJson = await emptyFilterRes.json() as GetAllContestantsResponse

            expect(noFilterRes.status).toBe(200)
            expect(emptyFilterRes.status).toBe(200)
            expect(emptyFilterJson.data).toEqual(noFilterJson.data)
        })

        it("should return only contestants matching the requested gender filter", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await getAllContestants(cookieHeader, csrfToken, "?filter=FEMALE")
            const json = await res.json() as GetAllContestantsResponse

            expect(json.data).toHaveLength(2)
            expect(json.data.every((contestant) => contestant.gender === "FEMALE")).toBe(true)
        })

        it("should not create or modify contestants when fetching the list", async () => {
            await seedMixedContestants()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const countBefore = await prisma.contestant.count()
            await getAllContestants(cookieHeader, csrfToken)
            const countAfter = await prisma.contestant.count()

            expect(countAfter).toBe(countBefore)
        })
    })
})
