import { prisma, type Prisma } from "../../infra/prisma.js";
import type { CanAdvanceReason, GetJudgeSubmissions, GetRoundResultsById } from "./types.js";
import { Role } from "../../../generated/prisma/enums.js";

type JudgeRow = { id: number, name: string }
type CategoryRow = { id: number, name: string }

const contestantSelect = {
    id: true,
    candidateNumber: true,
    name: true,
} as const

function computeAllJudgesSubmitted(
    judges: { id: number }[],
    categories: { id: number }[],
    submittedSet: Set<string>,
) {
    if (judges.length === 0) return false
    // Vacuous true when no categories — matches live-judge-submissions API contract.
    if (categories.length === 0) return true
    return judges.every(judge =>
        categories.every(category => submittedSet.has(`${judge.id}-${category.id}`)),
    )
}

async function loadJudgeSubmissionContext(
    tx: Prisma.TransactionClient,
    roundId: number,
) {
    const judges = await tx.user.findMany({
        where: { role: Role.JUDGE },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })
    const categories = await tx.category.findMany({
        where: { roundId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })
    const submittedPairs = await tx.score.findMany({
        where: {
            category: { roundId },
            judge: { role: Role.JUDGE },
        },
        select: { judgeId: true, categoryId: true },
        distinct: ["judgeId", "categoryId"],
    })
    const submittedSet = new Set(submittedPairs.map(p => `${p.judgeId}-${p.categoryId}`))

    return { judges, categories, submittedSet }
}

function buildJudgeSubmissions(
    judges: JudgeRow[],
    categories: CategoryRow[],
    submittedSet: Set<string>,
) {
    const judgeSubmissions = judges.map(judge => {
        const categoryFlags = categories.map(category => ({
            id: category.id,
            name: category.name,
            submitted: submittedSet.has(`${judge.id}-${category.id}`),
        }))
        return {
            judge: { id: judge.id, name: judge.name },
            categories: categoryFlags,
            fullySubmitted: categoryFlags.every(category => category.submitted),
        }
    })

    return {
        judgeSubmissions,
        fullySubmittedCount: judgeSubmissions.filter(judge => judge.fullySubmitted).length,
        totalJudges: judges.length,
        allJudgesSubmitted: computeAllJudgesSubmitted(judges, categories, submittedSet),
    }
}

export async function getJudgeSubmissions({ id }: GetJudgeSubmissions) {
    return await prisma.$transaction(async (tx) => {
        const { judges, categories, submittedSet } = await loadJudgeSubmissionContext(tx, id)
        return buildJudgeSubmissions(judges, categories, submittedSet)
    })
}

export async function getRoundResultsById({ id, phaseOrder }: GetRoundResultsById) {
    return await prisma.$transaction(async (tx) => {
        const roundTo2 = (value: number) => Math.round(value * 100) / 100

        const currentRound = await tx.round.findUnique({
            where: { id },
            select: {
                contestantLimit: true,
                winnersDeclaredAt: true,
            },
        })

        const { judges, categories, submittedSet } = await loadJudgeSubmissionContext(tx, id)
        const allJudgesSubmitted = computeAllJudgesSubmitted(judges, categories, submittedSet)
        const categoryIds = categories.map(category => category.id)

        const contestants = phaseOrder === 1
            ? await tx.contestant.findMany({
                select: contestantSelect,
                orderBy: { candidateNumber: "asc" },
            })
            : (
                await tx.roundContestant.findMany({
                    where: { roundId: id },
                    select: { contestant: { select: contestantSelect } },
                    orderBy: { contestant: { candidateNumber: "asc" } },
                })
            ).map(row => row.contestant)

        const contestantIds = contestants.map(contestant => contestant.id)

        const scores = categoryIds.length === 0 || contestantIds.length === 0
            ? []
            : await tx.score.findMany({
                where: {
                    categoryId: { in: categoryIds },
                    contestantId: { in: contestantIds },
                    judge: { role: Role.JUDGE },
                },
                select: {
                    judgeId: true,
                    contestantId: true,
                    categoryId: true,
                    value: true,
                },
            })

        const rankings = contestants.map(contestant => {
            const categoryScores = categories.map(category => {
                const judgeIds = [...new Set(
                    scores
                        .filter(score =>
                            score.contestantId === contestant.id
                            && score.categoryId === category.id,
                        )
                        .map(score => score.judgeId),
                )]

                const judgeTotals = judgeIds
                    .map(judgeId => {
                        const fieldScores = scores.filter(score =>
                            score.judgeId === judgeId
                            && score.contestantId === contestant.id
                            && score.categoryId === category.id,
                        )
                        if (fieldScores.length === 0) return null
                        return fieldScores.reduce((sum, score) => sum + Number(score.value), 0)
                    })
                    .filter((total): total is number => total !== null)

                const avgScore = judgeTotals.length === 0
                    ? null
                    : roundTo2(judgeTotals.reduce((sum, total) => sum + total, 0) / judgeTotals.length)

                return {
                    id: category.id,
                    name: category.name,
                    avgScore,
                }
            })

            const scoredCategories = categoryScores
                .map(category => category.avgScore)
                .filter((avgScore): avgScore is number => avgScore !== null)

            const overallScore = scoredCategories.length === 0
                ? null
                : roundTo2(scoredCategories.reduce((sum, score) => sum + score, 0) / scoredCategories.length)

            return {
                contestant: {
                    id: contestant.id,
                    candidateNumber: contestant.candidateNumber,
                    name: contestant.name,
                },
                categories: categoryScores,
                overallScore,
                rank: null as number | null,
            }
        })

        const sortedRankings = [...rankings].sort((a, b) => {
            if (a.overallScore === null && b.overallScore === null) {
                return a.contestant.candidateNumber - b.contestant.candidateNumber
            }
            if (a.overallScore === null) return 1
            if (b.overallScore === null) return -1
            if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore
            return a.contestant.candidateNumber - b.contestant.candidateNumber
        })

        sortedRankings.forEach((row, index) => {
            row.rank = row.overallScore === null ? null : index + 1
        })

        const nextRoundRecord = await tx.round.findFirst({
            where: { phaseOrder: phaseOrder + 1 },
            select: {
                id: true,
                name: true,
                contestantLimit: true,
                _count: {
                    select: {
                        categories: true,
                        roundContestants: true,
                    },
                },
            },
        })

        const isCompleted = Boolean(
            nextRoundRecord && nextRoundRecord._count.roundContestants > 0,
        )

        const nextRound = nextRoundRecord
            ? {
                id: nextRoundRecord.id,
                name: nextRoundRecord.name,
                contestantLimit: nextRoundRecord.contestantLimit,
                categoryCount: nextRoundRecord._count.categories,
            }
            : null

        const isFinalRound = nextRound === null
        const advancementLimit = isFinalRound
            ? currentRound?.contestantLimit ?? null
            : nextRound?.contestantLimit ?? null

        const shouldComputeAdvancement = allJudgesSubmitted
            && !isCompleted
            && categories.length > 0
            && advancementLimit !== null
            && advancementLimit > 0

        const emptyAdvancement = {
            hasTie: false,
            requiredSelections: 0,
            included: [] as { id: number, name: string, overallScore: number }[],
            tied: [] as { id: number, name: string, overallScore: number }[],
        }

        let advancement = emptyAdvancement

        if (shouldComputeAdvancement) {
            const limit = advancementLimit!
            const eligible = sortedRankings.filter(row => row.overallScore !== null)

            if (eligible.length <= limit) {
                advancement = {
                    hasTie: false,
                    requiredSelections: 0,
                    included: eligible.map(row => ({
                        id: row.contestant.id,
                        name: row.contestant.name,
                        overallScore: row.overallScore!,
                    })),
                    tied: [],
                }
            } else {
                const cutoffRow = eligible[limit - 1]!
                const cutoffScore = roundTo2(cutoffRow.overallScore!)
                const aboveCutoff = eligible.filter(row => roundTo2(row.overallScore!) > cutoffScore)
                const tiedAtCutoff = eligible.filter(row => roundTo2(row.overallScore!) === cutoffScore)
                const autoIncludedCount = aboveCutoff.length

                if (autoIncludedCount + tiedAtCutoff.length <= limit) {
                    advancement = {
                        hasTie: false,
                        requiredSelections: 0,
                        included: eligible.slice(0, limit).map(row => ({
                            id: row.contestant.id,
                            name: row.contestant.name,
                            overallScore: row.overallScore!,
                        })),
                        tied: [],
                    }
                } else {
                    advancement = {
                        hasTie: true,
                        requiredSelections: limit - autoIncludedCount,
                        included: aboveCutoff.map(row => ({
                            id: row.contestant.id,
                            name: row.contestant.name,
                            overallScore: row.overallScore!,
                        })),
                        tied: tiedAtCutoff.map(row => ({
                            id: row.contestant.id,
                            name: row.contestant.name,
                            overallScore: row.overallScore!,
                        })),
                    }
                }
            }
        }

        let canAdvance = false
        let canAdvanceReason: CanAdvanceReason | null = null

        if (isCompleted) {
            canAdvanceReason = "ROUND_COMPLETED"
        } else if (isFinalRound) {
            canAdvanceReason = null
        } else if (categories.length === 0) {
            canAdvanceReason = "CURRENT_ROUND_NO_CATEGORIES"
        } else if (!allJudgesSubmitted) {
            canAdvanceReason = "JUDGES_NOT_COMPLETE"
        } else if (nextRoundRecord && nextRoundRecord._count.roundContestants > 0) {
            canAdvanceReason = "NEXT_ROUND_ALREADY_FILLED"
        } else if (!nextRoundRecord || nextRoundRecord._count.categories === 0) {
            canAdvanceReason = "NEXT_ROUND_NO_CATEGORIES"
        } else if (!nextRound?.contestantLimit || nextRound.contestantLimit <= 0) {
            canAdvanceReason = "NEXT_ROUND_NO_CATEGORIES"
        } else {
            canAdvance = true
        }

        const winnersDeclaredAt = currentRound?.winnersDeclaredAt?.toISOString() ?? null
        const canDeclareWinners = isFinalRound
            && categories.length > 0
            && allJudgesSubmitted
            && winnersDeclaredAt === null
            && !advancement.hasTie

        return {
            rankings: sortedRankings,
            allJudgesSubmitted,
            isCompleted,
            canAdvance,
            canAdvanceReason,
            canDeclareWinners,
            winnersDeclaredAt,
            nextRound,
            advancement,
        }
    })
}
