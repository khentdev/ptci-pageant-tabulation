import { prisma, type Prisma } from "../../infra/prisma.js";
import { AppError } from "../../errors/appError.js";
import type { AdvanceRoundInput, CanAdvanceReason, DeclareWinnersInput, GetDeclaredWinners, GetJudgeSubmissions, GetRoundResultsById } from "./types.js";
import { Gender, Role } from "../../../generated/prisma/enums.js";

type JudgeRow = { id: number, name: string }
type CategoryRow = { id: number, name: string }

const GENDERS = [Gender.FEMALE, Gender.MALE] as const

const contestantSelect = {
    id: true,
    candidateNumber: true,
    name: true,
    gender: true,
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
    return prisma.$transaction(tx => getRoundResultsInTx(tx, { id, phaseOrder }))
}

async function getRoundResultsInTx(
    tx: Prisma.TransactionClient,
    { id, phaseOrder }: GetRoundResultsById,
) {
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
                gender: contestant.gender,
            },
            categories: categoryScores,
            overallScore,
            rank: null as number | null,
        }
    })

    const rankGroup = (rows: typeof rankings) => {
        const sorted = [...rows].sort((a, b) => {
            if (a.overallScore === null && b.overallScore === null) {
                return a.contestant.candidateNumber - b.contestant.candidateNumber
            }
            if (a.overallScore === null) return 1
            if (b.overallScore === null) return -1
            if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore
            return a.contestant.candidateNumber - b.contestant.candidateNumber
        })
        sorted.forEach((row, index) => {
            row.rank = row.overallScore === null ? null : index + 1
        })
        return sorted
    }

    // Ranking, rank numbering, and the advancement cutoff below are all
    // computed independently per gender — advancing the overall top N would
    // let one gender's stronger scores crowd the other out of the round.
    const rankingsByGender = new Map(
        GENDERS.map(gender => [
            gender,
            rankGroup(rankings.filter(row => row.contestant.gender === gender)),
        ]),
    )

    const sortedRankings = GENDERS.flatMap(gender => rankingsByGender.get(gender)!)

    const nextRoundRecord = await tx.round.findFirst({
        where: { phaseOrder: { gt: phaseOrder } },
        orderBy: { phaseOrder: "asc" },
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

    type AdvancementContestantRow = { id: number, name: string, gender: Gender, overallScore: number }
    type AdvancementGroup = {
        hasTie: boolean
        requiredSelections: number
        included: AdvancementContestantRow[]
        tied: AdvancementContestantRow[]
    }

    const emptyAdvancementGroup: AdvancementGroup = {
        hasTie: false,
        requiredSelections: 0,
        included: [],
        tied: [],
    }

    // Each gender's cutoff/tie is computed independently against the same
    // round limit — e.g. "Top 5" advances the top 5 males AND the top 5
    // females, not the top 5 overall.
    function computeAdvancementForGroup(rankedRows: typeof sortedRankings, limit: number): AdvancementGroup {
        const eligible = rankedRows.filter(row => row.overallScore !== null)
        const toAdvancementContestant = (row: (typeof eligible)[number]): AdvancementContestantRow => ({
            id: row.contestant.id,
            name: row.contestant.name,
            gender: row.contestant.gender,
            overallScore: row.overallScore!,
        })

        if (eligible.length <= limit) {
            return {
                hasTie: false,
                requiredSelections: 0,
                included: eligible.map(toAdvancementContestant),
                tied: [],
            }
        }

        const cutoffRow = eligible[limit - 1]!
        const cutoffScore = roundTo2(cutoffRow.overallScore!)
        const aboveCutoff = eligible.filter(row => roundTo2(row.overallScore!) > cutoffScore)
        const tiedAtCutoff = eligible.filter(row => roundTo2(row.overallScore!) === cutoffScore)
        const autoIncludedCount = aboveCutoff.length

        if (autoIncludedCount + tiedAtCutoff.length <= limit) {
            return {
                hasTie: false,
                requiredSelections: 0,
                included: eligible.slice(0, limit).map(toAdvancementContestant),
                tied: [],
            }
        }

        return {
            hasTie: true,
            requiredSelections: limit - autoIncludedCount,
            included: aboveCutoff.map(toAdvancementContestant),
            tied: tiedAtCutoff.map(toAdvancementContestant),
        }
    }

    let advancement: AdvancementGroup = emptyAdvancementGroup

    if (shouldComputeAdvancement) {
        const limit = advancementLimit!
        const advancementByGender = GENDERS.map(gender =>
            computeAdvancementForGroup(rankingsByGender.get(gender)!, limit),
        )

        advancement = {
            hasTie: advancementByGender.some(group => group.hasTie),
            requiredSelections: advancementByGender.reduce((sum, group) => sum + group.requiredSelections, 0),
            included: advancementByGender.flatMap(group => group.included),
            tied: advancementByGender.flatMap(group => group.tied),
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
}

type AdvancementContestantRow = { id: number, name: string, gender: Gender, overallScore: number }
type AdvancementPreview = {
    hasTie: boolean
    requiredSelections: number
    included: AdvancementContestantRow[]
    tied: AdvancementContestantRow[]
}

/**
 * Tie resolution runs once per gender: the flat `selectedContestantIds` body
 * carries picks for both groups together, so each gender's tied set and
 * required-selection count (limit minus that gender's auto-included count)
 * must be validated on its own — otherwise an admin could satisfy the total
 * required count while leaving one gender's tie unresolved and over-filling
 * the other. Once every group's count checks out, the merged total is
 * guaranteed to equal `limit` per gender, so no separate mismatch check is
 * needed afterward.
 */
function resolveTieAdvancingIds(
    advancement: AdvancementPreview,
    selectedContestantIds: number[],
    limit: number | null,
    field: string,
    countMismatchCode: "ADVANCE_CONTESTANT_COUNT_MISMATCH" | "DECLARE_WINNER_COUNT_MISMATCH",
): number[] {
    for (const gender of GENDERS) {
        const groupTied = advancement.tied.filter(contestant => contestant.gender === gender)
        if (groupTied.length === 0) continue

        const groupIncludedCount = advancement.included.filter(contestant => contestant.gender === gender).length
        const groupSelectedCount = selectedContestantIds.filter(
            contestantId => groupTied.some(contestant => contestant.id === contestantId),
        ).length
        const groupRequired = limit! - groupIncludedCount

        if (groupSelectedCount !== groupRequired) {
            throw new AppError(countMismatchCode, { field })
        }
    }

    return [
        ...advancement.included.map(contestant => contestant.id),
        ...selectedContestantIds,
    ]
}

export async function advanceRound({ id, selectedContestantIds }: AdvanceRoundInput) {
    return prisma.$transaction(async (tx) => {
        const currentRound = await tx.round.findUnique({
            where: { id },
            select: { phaseOrder: true },
        })
        if (!currentRound) throw new AppError("ROUND_PHASE_NOT_FOUND")

        const results = await getRoundResultsInTx(tx, {
            id,
            phaseOrder: currentRound.phaseOrder,
        })

        if (!results.canAdvance || !results.nextRound) {
            throw new AppError("ADVANCE_NOT_ALLOWED", {
                data: { reason: results.canAdvanceReason },
            })
        }

        const { advancement, nextRound } = results
        let advancingContestantIds: number[]

        if (!advancement.hasTie) {
            if (selectedContestantIds !== undefined) {
                throw new AppError("SELECTED_CONTESTANT_IDS_NOT_ALLOWED", {
                    field: "advance_round_input_selected_contestant_ids",
                })
            }

            advancingContestantIds = advancement.included.map(contestant => contestant.id)
        } else {
            if (!selectedContestantIds) {
                throw new AppError("SELECTED_CONTESTANT_IDS_REQUIRED", {
                    field: "advance_round_input_selected_contestant_ids",
                })
            }

            if (selectedContestantIds.length !== advancement.requiredSelections) {
                throw new AppError("SELECTED_CONTESTANT_IDS_COUNT_INVALID", {
                    field: "advance_round_input_selected_contestant_ids",
                })
            }

            const tiedIds = new Set(advancement.tied.map(contestant => contestant.id))
            if (!selectedContestantIds.every(contestantId => tiedIds.has(contestantId))) {
                throw new AppError("SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP", {
                    field: "advance_round_input_selected_contestant_ids",
                })
            }

            advancingContestantIds = resolveTieAdvancingIds(
                advancement,
                selectedContestantIds,
                nextRound.contestantLimit,
                "advance_round_input_selected_contestant_ids",
                "ADVANCE_CONTESTANT_COUNT_MISMATCH",
            )
        }

        if (advancingContestantIds.length === 0) {
            throw new AppError("ADVANCE_NOT_ALLOWED", {
                data: { reason: "NO_ELIGIBLE_CONTESTANTS" },
            })
        }

        const existingCount = await tx.roundContestant.count({
            where: { roundId: nextRound.id },
        })
        if (existingCount > 0) {
            throw new AppError("ADVANCE_NOT_ALLOWED", {
                data: { reason: "NEXT_ROUND_ALREADY_FILLED" },
            })
        }

        await tx.roundContestant.createMany({
            data: advancingContestantIds.map(contestantId => ({
                roundId: nextRound.id,
                contestantId,
            })),
        })
    })
}

type RankingRowForDeclare = {
    contestant: { id: number, candidateNumber: number, gender: Gender }
    overallScore: number | null
}

/** Placement is `1..N` within each gender — a Ms. and a Mr. can both take 1st. */
function buildDeclaredWinnerRows(
    winningContestantIds: number[],
    rankings: RankingRowForDeclare[],
) {
    const rankingByContestantId = new Map(
        rankings.map(row => [row.contestant.id, row]),
    )

    const winnerRows = winningContestantIds.map(contestantId => {
        const row = rankingByContestantId.get(contestantId)
        if (!row || row.overallScore === null) return null
        return row
    })

    if (winnerRows.some(row => row === null)) {
        throw new AppError("DECLARE_NOT_ALLOWED", {
            data: { reason: "NO_ELIGIBLE_CONTESTANTS" },
        })
    }

    const rows = winnerRows as RankingRowForDeclare[]

    return GENDERS.flatMap(gender => {
        const sorted = rows
            .filter(row => row.contestant.gender === gender)
            .sort((a, b) => {
                if (b.overallScore! !== a.overallScore!) return b.overallScore! - a.overallScore!
                return a.contestant.candidateNumber - b.contestant.candidateNumber
            })

        return sorted.map((row, index) => ({
            contestantId: row.contestant.id,
            gender,
            placement: index + 1,
            overallScore: row.overallScore!,
        }))
    })
}

export async function declareWinners({ id, selectedContestantIds }: DeclareWinnersInput) {
    return prisma.$transaction(async (tx) => {
        const currentRound = await tx.round.findUnique({
            where: { id },
            select: {
                phaseOrder: true,
                contestantLimit: true,
                winnersDeclaredAt: true,
                _count: { select: { categories: true } },
            },
        })
        if (!currentRound) throw new AppError("ROUND_PHASE_NOT_FOUND")

        const results = await getRoundResultsInTx(tx, {
            id,
            phaseOrder: currentRound.phaseOrder,
        })

        if (results.nextRound !== null) {
            throw new AppError("DECLARE_NOT_ALLOWED", {
                data: { reason: "NOT_FINAL_ROUND" },
            })
        }

        if (currentRound.winnersDeclaredAt !== null || results.winnersDeclaredAt !== null) {
            throw new AppError("DECLARE_NOT_ALLOWED", {
                data: { reason: "WINNERS_ALREADY_DECLARED" },
            })
        }

        const existingWinnerCount = await tx.roundWinner.count({ where: { roundId: id } })
        if (existingWinnerCount > 0) {
            throw new AppError("DECLARE_NOT_ALLOWED", {
                data: { reason: "WINNERS_ALREADY_DECLARED" },
            })
        }

        if (currentRound._count.categories === 0) {
            throw new AppError("DECLARE_NOT_ALLOWED", {
                data: { reason: "CURRENT_ROUND_NO_CATEGORIES" },
            })
        }

        if (!results.allJudgesSubmitted) {
            throw new AppError("DECLARE_NOT_ALLOWED", {
                data: { reason: "JUDGES_NOT_COMPLETE" },
            })
        }

        const { advancement } = results
        let winningContestantIds: number[]

        if (!advancement.hasTie) {
            if (selectedContestantIds !== undefined) {
                throw new AppError("SELECTED_CONTESTANT_IDS_NOT_ALLOWED", {
                    field: "declare_winners_input_selected_contestant_ids",
                })
            }

            winningContestantIds = advancement.included.map(contestant => contestant.id)
        } else {
            if (!selectedContestantIds) {
                throw new AppError("SELECTED_CONTESTANT_IDS_REQUIRED", {
                    field: "declare_winners_input_selected_contestant_ids",
                })
            }

            if (selectedContestantIds.length !== advancement.requiredSelections) {
                throw new AppError("SELECTED_CONTESTANT_IDS_COUNT_INVALID", {
                    field: "declare_winners_input_selected_contestant_ids",
                })
            }
            
            const tiedIds = new Set(advancement.tied.map(contestant => contestant.id))
            if (!selectedContestantIds.every(contestantId => tiedIds.has(contestantId))) {
                throw new AppError("SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP", {
                    field: "declare_winners_input_selected_contestant_ids",
                })
            }

            winningContestantIds = resolveTieAdvancingIds(
                advancement,
                selectedContestantIds,
                currentRound.contestantLimit,
                "declare_winners_input_selected_contestant_ids",
                "DECLARE_WINNER_COUNT_MISMATCH",
            )
        }

        if (winningContestantIds.length === 0) {
            throw new AppError("DECLARE_NOT_ALLOWED", {
                data: { reason: "NO_ELIGIBLE_CONTESTANTS" },
            })
        }

        const declaredWinnerRows = buildDeclaredWinnerRows(
            winningContestantIds,
            results.rankings,
        )

        await tx.roundWinner.createMany({
            data: declaredWinnerRows.map(row => ({
                roundId: id,
                contestantId: row.contestantId,
                gender: row.gender,
                placement: row.placement,
                overallScore: row.overallScore,
            })),
        })

        await tx.round.update({
            where: { id },
            data: { winnersDeclaredAt: new Date() },
        })
    })
}

export async function getDeclaredWinners({ id }: GetDeclaredWinners) {
    const round = await prisma.round.findUnique({
        where: { id },
        select: { winnersDeclaredAt: true },
    })
    if (!round) throw new AppError("ROUND_PHASE_NOT_FOUND")

    if (round.winnersDeclaredAt === null) {
        return { declaredWinners: null }
    }

    const roundWinners = await prisma.roundWinner.findMany({
        where: { roundId: id },
        orderBy: [{ gender: "desc" }, { placement: "asc" }],
        include: {
            contestant: { select: contestantSelect },
        },
    })

    const roundTo2 = (value: number) => Math.round(value * 100) / 100

    return {
        declaredWinners: roundWinners.map(row => ({
            placement: row.placement,
            contestant: row.contestant,
            overallScore: roundTo2(Number(row.overallScore)),
        })),
    }
}