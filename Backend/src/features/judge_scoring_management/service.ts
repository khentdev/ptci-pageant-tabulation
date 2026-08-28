import { AppError } from "../../errors/appError.js";
import logger from "../../infra/logger.js";
import { Prisma, prisma } from "../../infra/prisma.js";
import {
    getCategoryScoringFields,
    getJudgeRounds,
    getMyCategoryScores,
    getRoundContestants,
    submitCategoryScores,
} from "./data.js";
import type {
    GetCategoryScoringFieldsInput,
    GetMyCategoryScoresInput,
    GetRoundContestantsInput,
    SubmitCategoryScoresInput,
} from "./types.js";

export async function getJudgeRoundsService() {
    try {
        return await getJudgeRounds()
    } catch (err) {
        logger.error({ err }, "Error getting judge rounds")
        throw new AppError("SCORING_ROUNDS_GET_ERROR")
    }
}

export async function getRoundContestantsService({ id }: GetRoundContestantsInput) {
    const round = await prisma.round.findUnique({
        where: { id },
        select: { id: true, phaseOrder: true },
    })
    if (!round) {
        logger.warn({ id }, "Round not found on get round contestants")
        throw new AppError("SCORING_ROUND_NOT_FOUND")
    }

    try {
        return await getRoundContestants({ id, phaseOrder: round.phaseOrder })
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, id }, "Error getting round contestants")
        throw new AppError("SCORING_CONTESTANTS_GET_ERROR")
    }
}

export async function getCategoryScoringFieldsService({ id }: GetCategoryScoringFieldsInput) {
    try {
        const category = await getCategoryScoringFields(id)
        if (!category) {
            logger.warn({ id }, "Category not found on get scoring fields")
            throw new AppError("SCORING_CATEGORY_NOT_FOUND")
        }

        return {
            categoryId: category.id,
            categoryName: category.name,
            roundId: category.roundId,
            fields: category.criteriaFields.map((field) => ({
                id: field.id,
                name: field.name,
                maxValue: Number(field.maxValue),
            })),
        }
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, id }, "Error getting category scoring fields")
        throw new AppError("SCORING_FIELDS_GET_ERROR")
    }
}

export async function getMyCategoryScoresService({ id, judgeId }: GetMyCategoryScoresInput) {
    const category = await prisma.category.findUnique({ where: { id }, select: { id: true } })
    if (!category) {
        logger.warn({ id }, "Category not found on get my category scores")
        throw new AppError("SCORING_CATEGORY_NOT_FOUND")
    }

    try {
        const scores = await getMyCategoryScores({ id, judgeId })
        return {
            isSubmitted: scores.length > 0,
            scores: scores.map((score) => ({
                contestantId: score.contestantId,
                criteriaFieldId: score.criteriaFieldId,
                value: Number(score.value),
            })),
        }
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, id, judgeId }, "Error getting my category scores")
        throw new AppError("SCORING_SCORES_GET_ERROR")
    }
}

export async function submitCategoryScoresService({ id, judgeId, scores }: SubmitCategoryScoresInput) {
    const category = await prisma.category.findUnique({
        where: { id },
        select: {
            id: true,
            round: { select: { id: true, phaseOrder: true, winnersDeclaredAt: true } },
        },
    })
    if (!category) {
        logger.warn({ id }, "Category not found on submit scores")
        throw new AppError("SCORING_CATEGORY_NOT_FOUND")
    }

    const { round } = category

    if (round.winnersDeclaredAt !== null) {
        logger.warn({ id, roundId: round.id }, "Round is locked because winners are declared")
        throw new AppError("SCORING_ROUND_LOCKED")
    }

    const nextRound = await prisma.round.findFirst({
        where: { phaseOrder: { gt: round.phaseOrder } },
        orderBy: { phaseOrder: "asc" },
        select: { _count: { select: { roundContestants: true } } },
    })
    if (nextRound && nextRound._count.roundContestants > 0) {
        logger.warn({ id, roundId: round.id }, "Round is already completed")
        throw new AppError("SCORING_ROUND_COMPLETED")
    }

    const existingScoreCount = await prisma.score.count({ where: { categoryId: id, judgeId } })
    if (existingScoreCount > 0) {
        logger.warn({ id, judgeId }, "Scores already submitted for this judge and category")
        throw new AppError("SCORING_ALREADY_SUBMITTED")
    }

    const fields = await prisma.criteriaField.findMany({
        where: { categoryId: id },
        select: { id: true, maxValue: true },
    })
    if (fields.length === 0) {
        logger.warn({ id }, "Category has no scoring fields")
        throw new AppError("SCORING_CATEGORY_NO_FIELDS")
    }

    const contestants = await getRoundContestants({ id: round.id, phaseOrder: round.phaseOrder })
    if (contestants.length === 0) {
        logger.warn({ roundId: round.id }, "Round has no contestants")
        throw new AppError("SCORING_ROUND_NO_CONTESTANTS")
    }

    const fieldById = new Map(fields.map((field) => [field.id, field]))
    const contestantIds = new Set(contestants.map((contestant) => contestant.id))

    for (const score of scores) {
        if (!contestantIds.has(score.contestantId)) {
            logger.warn({ contestantId: score.contestantId }, "Contestant not in round on score submit")
            throw new AppError("SCORING_CONTESTANT_NOT_IN_ROUND", {
                data: { contestantId: score.contestantId },
            })
        }

        const field = fieldById.get(score.criteriaFieldId)
        if (!field) {
            logger.warn({ criteriaFieldId: score.criteriaFieldId }, "Field not in category on score submit")
            throw new AppError("SCORING_FIELD_NOT_IN_CATEGORY", {
                data: { criteriaFieldId: score.criteriaFieldId },
            })
        }

        const numericValue = Number(score.value)
        if (numericValue < 0 || numericValue > Number(field.maxValue)) {
            logger.warn({ score }, "Score value out of range")
            throw new AppError("SCORING_VALUE_OUT_OF_RANGE", {
                data: {
                    contestantId: score.contestantId,
                    criteriaFieldId: score.criteriaFieldId,
                    maxValue: Number(field.maxValue),
                },
            })
        }
    }

    const expectedCount = contestants.length * fields.length
    const submittedPairs = new Set(scores.map((score) => `${score.contestantId}-${score.criteriaFieldId}`))
    if (scores.length !== expectedCount || submittedPairs.size !== expectedCount) {
        logger.warn({ id, judgeId }, "Incomplete score submission")
        throw new AppError("SCORING_SCORES_INCOMPLETE")
    }

    try {
        await submitCategoryScores({ id, judgeId, scores })
    } catch (err) {
        if (err instanceof AppError) throw err
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            logger.warn({ id, judgeId }, "Duplicate score caught by database constraint")
            throw new AppError("SCORING_ALREADY_SUBMITTED")
        }
        logger.error({ err, id, judgeId }, "Error submitting scores")
        throw new AppError("SCORING_SUBMIT_ERROR")
    }
}
