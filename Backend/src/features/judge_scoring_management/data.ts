import { prisma } from "../../infra/prisma.js";
import { AppError } from "../../errors/appError.js";
import type {
    GetMyCategoryScoresInput,
    GetRoundContestantsParams,
    SubmitCategoryScoresInput,
} from "./types.js";

const contestantSelect = {
    id: true,
    candidateNumber: true,
    name: true,
} as const

export async function getJudgeRounds() {
    const totalContestants = await prisma.contestant.count()

    const rounds = await prisma.round.findMany({
        orderBy: { phaseOrder: "asc" },
        select: {
            id: true,
            name: true,
            phaseOrder: true,
            categories: {
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            },
            _count: { select: { roundContestants: true } },
        },
    })

    return rounds.map((round) => ({
        id: round.id,
        name: round.name,
        phaseOrder: round.phaseOrder,
        hasContestants: round.phaseOrder === 1
            ? totalContestants > 0
            : round._count.roundContestants > 0,
        categories: round.categories,
    }))
}

export async function getRoundContestants({ id, phaseOrder }: GetRoundContestantsParams) {
    if (phaseOrder === 1) {
        return await prisma.contestant.findMany({
            select: contestantSelect,
            orderBy: { candidateNumber: "asc" },
        })
    }

    const roundContestants = await prisma.roundContestant.findMany({
        where: { roundId: id },
        select: { contestant: { select: contestantSelect } },
        orderBy: { contestant: { candidateNumber: "asc" } },
    })

    return roundContestants.map((row) => row.contestant)
}

export async function getCategoryScoringFields(categoryId: number) {
    return await prisma.category.findUnique({
        where: { id: categoryId },
        select: {
            id: true,
            name: true,
            roundId: true,
            criteriaFields: {
                select: { id: true, name: true, maxValue: true },
                orderBy: { maxValue: "desc" },
            },
        },
    })
}

export async function getMyCategoryScores({ id, judgeId }: GetMyCategoryScoresInput) {
    return await prisma.score.findMany({
        where: { categoryId: id, judgeId },
        select: { contestantId: true, criteriaFieldId: true, value: true },
    })
}

export async function submitCategoryScores({ id, judgeId, scores }: SubmitCategoryScoresInput) {
    await prisma.$transaction(async (tx) => {
        // Re-check inside the transaction to close the read-then-write race the
        // service-level pre-check leaves open; the @@unique constraint on Score
        // is the final line of defense if two requests still land at the same time.
        const existingCount = await tx.score.count({ where: { categoryId: id, judgeId } })
        if (existingCount > 0) {
            throw new AppError("SCORING_ALREADY_SUBMITTED")
        }

        await tx.score.createMany({
            data: scores.map((score) => ({
                judgeId,
                contestantId: score.contestantId,
                categoryId: id,
                criteriaFieldId: score.criteriaFieldId,
                value: score.value,
            })),
        })
    })
}
