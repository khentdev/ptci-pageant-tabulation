import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { AddContestantResponse } from "../types.js"

describe("Add Contestant Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Add Contestant Admin",
        username: "test-add-contestant-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Add Contestant Judge",
        username: "test-add-contestant-judge",
        role: "JUDGE" as Role,
    }

    const deviceFingerprint = "{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"

    const validBody = {
        candidateNumber: "1",
        name: "Aniar, Andrea Mae",
        gender: "FEMALE",
        teamName: "Yellow Team",
        teamColor: "Yellow",
    }

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

    const postAddContestant = async (
        cookieHeader: string,
        csrfToken: string,
        body: Record<string, unknown>,
    ) => {
        return app.request("/contestants", {
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
        it("should return 403 Forbidden if a judge attempts to add a contestant", async () => {
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await postAddContestant(cookieHeader, csrfToken, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should create a contestant with all required fields", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, validBody)
            expect(res.status).toBe(201)

            const json = await res.json() as AddContestantResponse
            expect(json.message).toBe("Contestant added successfully")

            const contestant = await prisma.contestant.findFirst({
                where: { candidateNumber: 1 },
                select: {
                    candidateNumber: true,
                    name: true,
                    gender: true,
                    teamName: true,
                    teamColor: true,
                },
            })
            expect(contestant).toEqual({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
        })

        it("should trim whitespace from name, teamName, and teamColor before saving", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                candidateNumber: "2",
                name: "  Dela Cruz, Christine  ",
                gender: "FEMALE",
                teamName: "  Purple Team  ",
                teamColor: "  Purple  ",
            })
            expect(res.status).toBe(201)

            const contestant = await prisma.contestant.findFirst({
                where: { candidateNumber: 2 },
                select: { name: true, teamName: true, teamColor: true },
            })
            expect(contestant).toEqual({
                name: "Dela Cruz, Christine",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
        })

        it("should normalize gender casing before saving", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                candidateNumber: "3",
                name: "Test Contestant",
                gender: "Female",
                teamName: "Team A",
                teamColor: "Red",
            })
            expect(res.status).toBe(201)

            const contestant = await prisma.contestant.findFirst({
                where: { candidateNumber: 3 },
                select: { gender: true },
            })
            expect(contestant?.gender).toBe("FEMALE")
        })

        it("should allow multiple contestants with different candidate numbers", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddContestant(cookieHeader, csrfToken, validBody)
            const res = await postAddContestant(cookieHeader, csrfToken, {
                candidateNumber: "2",
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            expect(res.status).toBe(201)

            const contestants = await prisma.contestant.findMany({
                orderBy: { candidateNumber: "asc" },
                select: { candidateNumber: true, name: true },
            })
            expect(contestants).toEqual([
                { candidateNumber: 1, name: "Aniar, Andrea Mae" },
                { candidateNumber: 2, name: "Dela Cruz, Christine" },
            ])
        })

        it("should allow contestants with the same name when candidate numbers differ", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddContestant(cookieHeader, csrfToken, validBody)
            const res = await postAddContestant(cookieHeader, csrfToken, {
                candidateNumber: "2",
                name: "Aniar, Andrea Mae",
                gender: "MALE",
                teamName: "Blue Team",
                teamColor: "Blue",
            })
            expect(res.status).toBe(201)

            const contestants = await prisma.contestant.findMany({
                where: { name: "Aniar, Andrea Mae" },
                select: { candidateNumber: true },
                orderBy: { candidateNumber: "asc" },
            })
            expect(contestants).toEqual([
                { candidateNumber: 1 },
                { candidateNumber: 2 },
            ])
        })

        it("should not create a round_contestants row on add", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, validBody)
            expect(res.status).toBe(201)

            const roundContestantCount = await prisma.roundContestant.count()
            expect(roundContestantCount).toBe(0)
        })
        it("should normalize lowercase male gender before saving", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                candidateNumber: "4",
                name: "Test Contestant",
                gender: "male",
                teamName: "Team B",
                teamColor: "Green",
            })
            expect(res.status).toBe(201)

            const contestant = await prisma.contestant.findFirst({
                where: { candidateNumber: 4 },
                select: { gender: true },
            })
            expect(contestant?.gender).toBe("MALE")
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "candidate number is empty",
                body: { ...validBody, candidateNumber: "" },
                code: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is whitespace only",
                body: { ...validBody, candidateNumber: "   " },
                code: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is zero",
                body: { ...validBody, candidateNumber: "0" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is negative",
                body: { ...validBody, candidateNumber: "-1" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is not an integer",
                body: { ...validBody, candidateNumber: "1.5" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is not numeric",
                body: { ...validBody, candidateNumber: "abc" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is missing",
                body: {
                    name: validBody.name,
                    gender: validBody.gender,
                    teamName: validBody.teamName,
                    teamColor: validBody.teamColor,
                },
                code: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
                field: "add_contestant_input_candidate_number",
            },
            {
                testCase: "name is empty",
                body: { ...validBody, name: "" },
                code: "CONTESTANT_NAME_REQUIRED",
                field: "add_contestant_input_name",
            },
            {
                testCase: "name is whitespace only",
                body: { ...validBody, name: "   " },
                code: "CONTESTANT_NAME_REQUIRED",
                field: "add_contestant_input_name",
            },
            {
                testCase: "name is missing",
                body: {
                    candidateNumber: validBody.candidateNumber,
                    gender: validBody.gender,
                    teamName: validBody.teamName,
                    teamColor: validBody.teamColor,
                },
                code: "CONTESTANT_NAME_REQUIRED",
                field: "add_contestant_input_name",
            },
            {
                testCase: "gender is empty",
                body: { ...validBody, gender: "" },
                code: "CONTESTANT_GENDER_REQUIRED",
                field: "add_contestant_input_gender",
            },
            {
                testCase: "gender is missing",
                body: {
                    candidateNumber: validBody.candidateNumber,
                    name: validBody.name,
                    teamName: validBody.teamName,
                    teamColor: validBody.teamColor,
                },
                code: "CONTESTANT_GENDER_REQUIRED",
                field: "add_contestant_input_gender",
            },
            {
                testCase: "gender is invalid",
                body: { ...validBody, gender: "OTHER" },
                code: "CONTESTANT_GENDER_INVALID",
                field: "add_contestant_input_gender",
            },
            {
                testCase: "team name is empty",
                body: { ...validBody, teamName: "" },
                code: "CONTESTANT_TEAM_NAME_REQUIRED",
                field: "add_contestant_input_team_name",
            },
            {
                testCase: "team name is missing",
                body: {
                    candidateNumber: validBody.candidateNumber,
                    name: validBody.name,
                    gender: validBody.gender,
                    teamColor: validBody.teamColor,
                },
                code: "CONTESTANT_TEAM_NAME_REQUIRED",
                field: "add_contestant_input_team_name",
            },
            {
                testCase: "team color is empty",
                body: { ...validBody, teamColor: "" },
                code: "CONTESTANT_TEAM_COLOR_REQUIRED",
                field: "add_contestant_input_team_color",
            },
            {
                testCase: "team color is missing",
                body: {
                    candidateNumber: validBody.candidateNumber,
                    name: validBody.name,
                    gender: validBody.gender,
                    teamName: validBody.teamName,
                },
                code: "CONTESTANT_TEAM_COLOR_REQUIRED",
                field: "add_contestant_input_team_color",
            },
        ])("should return $code if $testCase", async ({ body, code, field }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, body)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it("should reject a numeric candidateNumber in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                ...validBody,
                candidateNumber: 1,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_CANDIDATE_NUMBER_REQUIRED")
            expect(json.error.field).toBe("add_contestant_input_candidate_number")
        })

        it("should reject a numeric name in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                ...validBody,
                name: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_NAME_REQUIRED")
            expect(json.error.field).toBe("add_contestant_input_name")
        })

        it("should reject a numeric teamName in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                ...validBody,
                teamName: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_TEAM_NAME_REQUIRED")
            expect(json.error.field).toBe("add_contestant_input_team_name")
        })

        it("should reject a numeric teamColor in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                ...validBody,
                teamColor: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_TEAM_COLOR_REQUIRED")
            expect(json.error.field).toBe("add_contestant_input_team_color")
        })

        it("should reject a numeric gender in the JSON body", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, {
                ...validBody,
                gender: 1,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_GENDER_REQUIRED")
            expect(json.error.field).toBe("add_contestant_input_gender")
        })

        it("should not create a contestant when validation fails", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddContestant(cookieHeader, csrfToken, { ...validBody, name: "" })

            const contestantCount = await prisma.contestant.count()
            expect(contestantCount).toBe(0)
        })
    })

    describe("business rules", () => {
        it("should return CONTESTANT_CANDIDATE_NUMBER_DUPLICATE when candidate number already exists", async () => {
            await seedContestant({
                candidateNumber: 1,
                name: "Existing Contestant",
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await postAddContestant(cookieHeader, csrfToken, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE")
        })

        it("should not create a contestant when candidate number is duplicate", async () => {
            await seedContestant({
                candidateNumber: 1,
                name: "Existing Contestant",
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await postAddContestant(cookieHeader, csrfToken, validBody)

            const contestantCount = await prisma.contestant.count()
            expect(contestantCount).toBe(1)
        })
    })
})
