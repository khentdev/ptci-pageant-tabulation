import * as argon2 from "argon2"

import { Role } from "../../generated/prisma/enums.js"
import { prisma, type Prisma } from "../../src/infra/prisma.js"
import logger from "../../src/infra/logger.js"

export const DEV_JUDGE_PASSWORD = process.env["DEV_JUDGE_PASSWORD"] ?? "judge-dev-password"

export type SeedRound = {
    id: number
    name: string
    phaseOrder: number
}

export type SeedContestant = {
    id: number
    candidateNumber: number
    name: string
}

export type SeedJudge = {
    id: number
    name: string
    username: string
}

export type SeedSummary = {
    rounds: Record<string, SeedRound>
    contestants: SeedContestant[]
    judges: Record<string, SeedJudge>
}

export async function wipeDevData() {
    await prisma.$transaction(async (tx) => {
        await tx.score.deleteMany()
        await tx.criteriaField.deleteMany()
        await tx.category.deleteMany()
        await tx.roundWinner.deleteMany()
        await tx.roundContestant.deleteMany()
        await tx.round.deleteMany()
        await tx.contestant.deleteMany()
        await tx.user.deleteMany({ where: { role: Role.JUDGE } })
    })
    logger.info("Wiped non-admin dev data")
}

export async function createJudge(data: { name: string; username: string }) {
    const hashedPassword = await argon2.hash(DEV_JUDGE_PASSWORD)
    return prisma.user.create({
        data: {
            name: data.name,
            username: data.username,
            hashedPassword,
            role: Role.JUDGE,
        },
        select: { id: true, name: true, username: true },
    })
}

export async function createContestants(
    data: {
        candidateNumber: number
        name: string
        gender: "MALE" | "FEMALE"
        teamName: string
        teamColor: string
    }[],
) {
    await prisma.contestant.createMany({ data })
    return prisma.contestant.findMany({
        where: { candidateNumber: { in: data.map(c => c.candidateNumber) } },
        select: { id: true, candidateNumber: true, name: true },
        orderBy: { candidateNumber: "asc" },
    })
}

export async function createRound(data: {
    name: string
    phaseOrder: number
    contestantLimit?: number | null
}) {
    return prisma.round.create({
        data: {
            name: data.name,
            phaseOrder: data.phaseOrder,
            contestantLimit: data.contestantLimit ?? null,
        },
        select: { id: true, name: true, phaseOrder: true },
    })
}

export async function createCategoryWithFields(
    roundId: number,
    name: string,
    fields: { name: string; maxValue: number }[],
) {
    const total = fields.reduce((sum, field) => sum + field.maxValue, 0)
    if (fields.length > 0 && total !== 100) {
        throw new Error(`Category "${name}" fields must sum to 100 (got ${total})`)
    }

    return prisma.category.create({
        data: {
            name,
            roundId,
            criteriaFields: fields.length > 0
                ? { create: fields }
                : undefined,
        },
        include: {
            criteriaFields: { select: { id: true, name: true, maxValue: true } },
        },
    })
}

export async function createEmptyCategory(roundId: number, name: string) {
    return prisma.category.create({
        data: { name, roundId },
        select: { id: true, name: true, roundId: true },
    })
}

export async function insertRoundContestants(roundId: number, contestantIds: number[]) {
    if (contestantIds.length === 0) return
    await prisma.roundContestant.createMany({
        data: contestantIds.map(contestantId => ({ roundId, contestantId })),
    })
}

type CategoryWithFields = {
    id: number
    criteriaFields: { id: number; maxValue: Prisma.Decimal }[]
}

export async function submitCategoryScores(
    judgeId: number,
    category: CategoryWithFields,
    scoresByContestantId: Map<number, number[]>,
) {
    const rows: {
        judgeId: number
        contestantId: number
        categoryId: number
        criteriaFieldId: number
        value: number
    }[] = []

    for (const [contestantId, values] of scoresByContestantId) {
        if (values.length !== category.criteriaFields.length) {
            throw new Error(
                `Contestant ${contestantId} score count mismatch for category ${category.id}`,
            )
        }
        category.criteriaFields.forEach((field, index) => {
            rows.push({
                judgeId,
                contestantId,
                categoryId: category.id,
                criteriaFieldId: field.id,
                value: values[index]!,
            })
        })
    }

    if (rows.length > 0) {
        await prisma.score.createMany({ data: rows })
    }
}

/** Single-field category shorthand — one total per contestant per judge. */
export async function submitSingleFieldScores(
    judgeId: number,
    category: CategoryWithFields,
    contestantScores: { contestantId: number; total: number }[],
) {
    const map = new Map<number, number[]>()
    for (const { contestantId, total } of contestantScores) {
        map.set(contestantId, [total])
    }
    await submitCategoryScores(judgeId, category, map)
}

export function logSeedSummary(summary: SeedSummary) {
    const roundLines = Object.entries(summary.rounds)
        .map(([key, round]) => `  ${key}: id=${round.id} (${round.name})`)
        .join("\n")

    logger.info(
        {
            rounds: summary.rounds,
            judgeUsernames: Object.fromEntries(
                Object.entries(summary.judges).map(([key, judge]) => [key, judge.username]),
            ),
            unscoredContestants: summary.contestants
                .filter(c => c.candidateNumber >= 111)
                .map(c => c.candidateNumber),
        },
        `Dev seed complete — see prisma/seeds/SEED_REFERENCE.md\n${roundLines}`,
    )
}
