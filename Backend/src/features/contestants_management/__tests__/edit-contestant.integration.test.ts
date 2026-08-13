import * as argon2 from "argon2"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import createHonoApp from "../../../createHonoApp.js"
import { prisma } from "../../../infra/prisma.js"

import type { Role } from "../../../../generated/prisma/enums.js"
import type { EditContestantResponse } from "../types.js"

describe("Edit Contestant Integration Test", () => {
    const app = createHonoApp()

    const TEST_PASSWORD = "password123123123"
    const TEST_ADMIN = {
        name: "Edit Contestant Admin",
        username: "test-edit-contestant-admin",
        role: "ADMIN" as Role,
    }
    const TEST_JUDGE = {
        name: "Edit Contestant Judge",
        username: "test-edit-contestant-judge",
        role: "JUDGE" as Role,
    }
    const TEST_SCORE_JUDGE = {
        name: "Edit Contestant Score Judge",
        username: "test-edit-contestant-score-judge",
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

    const patchEditContestant = async (
        cookieHeader: string,
        csrfToken: string,
        id: number | string,
        body: Record<string, unknown>,
    ) => {
        return app.request(`/contestants/${id}`, {
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
            select: {
                id: true,
                candidateNumber: true,
                name: true,
                gender: true,
                teamName: true,
                teamColor: true,
            },
        })
    }

    const seedRound = async (data: { name: string; phaseOrder: number; contestantLimit?: number | null }) => {
        return prisma.round.create({
            data: {
                name: data.name,
                phaseOrder: data.phaseOrder,
                contestantLimit: data.contestantLimit ?? null,
            },
            select: {
                id: true,
            },
        })
    }

    const seedCategory = async (data: { name: string; roundId: number }) => {
        return prisma.category.create({
            data: {
                name: data.name,
                roundId: data.roundId,
            },
            select: {
                id: true,
            },
        })
    }

    const seedContestantWithScores = async () => {
        const round = await seedRound({ name: "Preliminary", phaseOrder: 1 })
        const category = await seedCategory({ name: "Swimwear", roundId: round.id })
        const criteriaField = await prisma.criteriaField.create({
            data: {
                categoryId: category.id,
                name: "Stage Presence",
                maxValue: 100,
            },
            select: { id: true },
        })
        const judge = await seedUser(TEST_SCORE_JUDGE)
        const contestant = await seedContestant({
            candidateNumber: 1,
            name: "Test Contestant",
            gender: "FEMALE",
            teamName: "Team A",
            teamColor: "Red",
        })

        await prisma.score.create({
            data: {
                judgeId: judge.id,
                contestantId: contestant.id,
                categoryId: category.id,
                criteriaFieldId: criteriaField.id,
                value: 85,
            },
        })

        return { contestant }
    }

    beforeEach(async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username, TEST_SCORE_JUDGE.username],
                },
            },
        })
    })

    afterAll(async () => {
        await prisma.score.deleteMany()
        await prisma.roundContestant.deleteMany()
        await prisma.criteriaField.deleteMany()
        await prisma.contestant.deleteMany()
        await prisma.category.deleteMany()
        await prisma.round.deleteMany()
        await prisma.user.deleteMany({
            where: {
                username: {
                    in: [TEST_ADMIN.username, TEST_JUDGE.username, TEST_SCORE_JUDGE.username],
                },
            },
        })
        await prisma.$disconnect()
    })

    describe("authenticate", () => {
        it("should return 401 Unauthorized if no credentials are provided", async () => {
            const res = await app.request("/contestants/1", {
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
        it("should return 403 Forbidden if a judge attempts to edit a contestant", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            await seedUser(TEST_JUDGE)
            const { cookieHeader, csrfToken } = await loginAndGetCredentials(TEST_JUDGE.username)

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(403)
            expect(json.error.code).toBe("FORBIDDEN")
        })
    })

    describe("happy path", () => {
        it("should update all contestant fields", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "2",
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            expect(res.status).toBe(200)

            const json = await res.json() as EditContestantResponse
            expect(json.message).toBe("Contestant updated successfully")

            const updatedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: {
                    candidateNumber: true,
                    name: true,
                    gender: true,
                    teamName: true,
                    teamColor: true,
                },
            })
            expect(updatedContestant).toEqual({
                candidateNumber: 2,
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
        })

        it("should trim whitespace from name, teamName, and teamColor before saving", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "1",
                name: "  Dela Cruz, Christine  ",
                gender: "FEMALE",
                teamName: "  Purple Team  ",
                teamColor: "  Purple  ",
            })
            expect(res.status).toBe(200)

            const updatedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { name: true, teamName: true, teamColor: true },
            })
            expect(updatedContestant).toEqual({
                name: "Dela Cruz, Christine",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
        })

        it("should normalize gender casing before saving", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "1",
                name: "Aniar, Andrea Mae",
                gender: "Female",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            expect(res.status).toBe(200)

            const updatedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { gender: true },
            })
            expect(updatedContestant?.gender).toBe("FEMALE")
        })

        it("should normalize lowercase male gender before saving", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Test Contestant",
                gender: "FEMALE",
                teamName: "Team A",
                teamColor: "Red",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "1",
                name: "Test Contestant",
                gender: "male",
                teamName: "Team B",
                teamColor: "Green",
            })
            expect(res.status).toBe(200)

            const updatedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { gender: true },
            })
            expect(updatedContestant?.gender).toBe("MALE")
        })

        it("should succeed when keeping the same candidate number", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, validBody)
            expect(res.status).toBe(200)
        })

        it("should succeed when submitting identical values", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "1",
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            expect(res.status).toBe(200)

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: {
                    candidateNumber: true,
                    name: true,
                    gender: true,
                    teamName: true,
                    teamColor: true,
                },
            })
            expect(unchangedContestant).toEqual({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
        })

        it("should not create or modify round_contestants rows on edit", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "2",
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            expect(res.status).toBe(200)

            const roundContestantCount = await prisma.roundContestant.count()
            expect(roundContestantCount).toBe(0)
        })
    })

    describe("validation", () => {
        it.each([
            {
                testCase: "contestant id is not a number",
                id: "abc",
                code: "CONTESTANT_ID_INVALID",
                field: "edit_contestant_input_id",
            },
            {
                testCase: "contestant id is zero",
                id: "0",
                code: "CONTESTANT_ID_INVALID",
                field: "edit_contestant_input_id",
            },
            {
                testCase: "contestant id is negative",
                id: "-1",
                code: "CONTESTANT_ID_INVALID",
                field: "edit_contestant_input_id",
            },
            {
                testCase: "contestant id is not an integer",
                id: "1.5",
                code: "CONTESTANT_ID_INVALID",
                field: "edit_contestant_input_id",
            },
        ])("should return $code if $testCase", async ({ id, code, field }) => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, id, validBody)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it.each([
            {
                testCase: "candidate number is empty",
                body: { ...validBody, candidateNumber: "" },
                code: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
                field: "edit_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is whitespace only",
                body: { ...validBody, candidateNumber: "   " },
                code: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
                field: "edit_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is zero",
                body: { ...validBody, candidateNumber: "0" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "edit_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is negative",
                body: { ...validBody, candidateNumber: "-1" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "edit_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is not an integer",
                body: { ...validBody, candidateNumber: "1.5" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "edit_contestant_input_candidate_number",
            },
            {
                testCase: "candidate number is not numeric",
                body: { ...validBody, candidateNumber: "abc" },
                code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
                field: "edit_contestant_input_candidate_number",
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
                field: "edit_contestant_input_candidate_number",
            },
            {
                testCase: "name is empty",
                body: { ...validBody, name: "" },
                code: "CONTESTANT_NAME_REQUIRED",
                field: "edit_contestant_input_name",
            },
            {
                testCase: "name is whitespace only",
                body: { ...validBody, name: "   " },
                code: "CONTESTANT_NAME_REQUIRED",
                field: "edit_contestant_input_name",
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
                field: "edit_contestant_input_name",
            },
            {
                testCase: "gender is empty",
                body: { ...validBody, gender: "" },
                code: "CONTESTANT_GENDER_REQUIRED",
                field: "edit_contestant_input_gender",
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
                field: "edit_contestant_input_gender",
            },
            {
                testCase: "gender is invalid",
                body: { ...validBody, gender: "OTHER" },
                code: "CONTESTANT_GENDER_INVALID",
                field: "edit_contestant_input_gender",
            },
            {
                testCase: "team name is empty",
                body: { ...validBody, teamName: "" },
                code: "CONTESTANT_TEAM_NAME_REQUIRED",
                field: "edit_contestant_input_team_name",
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
                field: "edit_contestant_input_team_name",
            },
            {
                testCase: "team color is empty",
                body: { ...validBody, teamColor: "" },
                code: "CONTESTANT_TEAM_COLOR_REQUIRED",
                field: "edit_contestant_input_team_color",
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
                field: "edit_contestant_input_team_color",
            },
        ])("should return $code if $testCase", async ({ body, code, field }) => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, body)
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe(code)
            expect(json.error.field).toBe(field)
        })

        it("should reject a numeric candidateNumber in the JSON body", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                ...validBody,
                candidateNumber: 1,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_CANDIDATE_NUMBER_REQUIRED")
            expect(json.error.field).toBe("edit_contestant_input_candidate_number")
        })

        it("should reject a numeric name in the JSON body", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                ...validBody,
                name: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_NAME_REQUIRED")
            expect(json.error.field).toBe("edit_contestant_input_name")
        })

        it("should reject a numeric teamName in the JSON body", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                ...validBody,
                teamName: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_TEAM_NAME_REQUIRED")
            expect(json.error.field).toBe("edit_contestant_input_team_name")
        })

        it("should reject a numeric teamColor in the JSON body", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                ...validBody,
                teamColor: 123,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_TEAM_COLOR_REQUIRED")
            expect(json.error.field).toBe("edit_contestant_input_team_color")
        })

        it("should reject a numeric gender in the JSON body", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                ...validBody,
                gender: 1,
            })
            const json = await res.json() as { error: { code: string; field: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_GENDER_REQUIRED")
            expect(json.error.field).toBe("edit_contestant_input_gender")
        })

        it("should not update a contestant when validation fails", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await patchEditContestant(cookieHeader, csrfToken, contestant.id, { ...validBody, name: "" })

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { name: true },
            })
            expect(unchangedContestant?.name).toBe("Aniar, Andrea Mae")
        })
    })

    describe("business rules", () => {
        it("should return CONTESTANT_NOT_FOUND when the contestant does not exist", async () => {
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, 99999, validBody)
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(404)
            expect(json.error.code).toBe("CONTESTANT_NOT_FOUND")
        })

        it("should not update any contestant when the contestant lookup fails", async () => {
            const contestant = await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await patchEditContestant(cookieHeader, csrfToken, 99999, validBody)

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { name: true },
            })
            expect(unchangedContestant?.name).toBe("Aniar, Andrea Mae")
        })

        it("should return CONTESTANT_LOCKED when scores exist for the contestant", async () => {
            const { contestant } = await seedContestantWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "2",
                name: "Updated Name",
                gender: "FEMALE",
                teamName: "Team B",
                teamColor: "Blue",
            })
            const json = await res.json() as { error: { code: string; message: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_LOCKED")
            expect(json.error.message).toBe("Contestant cannot be edited because it has scores already.")
        })

        it("should not update the contestant when scores exist", async () => {
            const { contestant } = await seedContestantWithScores()
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "2",
                name: "Updated Name",
                gender: "FEMALE",
                teamName: "Team B",
                teamColor: "Blue",
            })

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { name: true },
            })
            expect(unchangedContestant?.name).toBe("Test Contestant")
        })

        it("should return CONTESTANT_CANDIDATE_NUMBER_DUPLICATE when candidate number belongs to another contestant", async () => {
            await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const contestant = await seedContestant({
                candidateNumber: 2,
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            const res = await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "1",
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            const json = await res.json() as { error: { code: string } }

            expect(res.status).toBe(400)
            expect(json.error.code).toBe("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE")
        })

        it("should not update the contestant when candidate number is duplicate", async () => {
            await seedContestant({
                candidateNumber: 1,
                name: "Aniar, Andrea Mae",
                gender: "FEMALE",
                teamName: "Yellow Team",
                teamColor: "Yellow",
            })
            const contestant = await seedContestant({
                candidateNumber: 2,
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })
            const { cookieHeader, csrfToken } = await seedAdminCredentials()

            await patchEditContestant(cookieHeader, csrfToken, contestant.id, {
                candidateNumber: "1",
                name: "Dela Cruz, Christine",
                gender: "FEMALE",
                teamName: "Purple Team",
                teamColor: "Purple",
            })

            const unchangedContestant = await prisma.contestant.findUnique({
                where: { id: contestant.id },
                select: { candidateNumber: true },
            })
            expect(unchangedContestant?.candidateNumber).toBe(2)
        })
    })
})
