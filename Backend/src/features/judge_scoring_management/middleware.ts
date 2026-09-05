import type { Context, Next } from "hono";
import { AppError } from "../../errors/appError.js";
import type { TokenPayload } from "../../lib/jwt/index.js";
import type { ScoringErrorCodes } from "./error.js";
import type { SubmitCategoryScoreEntry, SubmitCategoryScoresRequestBody } from "./types.js";

const isPositiveInteger = (value: unknown): boolean =>
    typeof value === "number" && Number.isInteger(value) && value > 0

const isValidScoreValue = (value: unknown): boolean =>
    typeof value === "string" && /^\d+(\.\d{1,2})?$/.test(value.trim())

function parsePositiveIdParam(c: Context, code: ScoringErrorCodes, field: string): number {
    const parsedId = Number(c.req.param("id"))
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError(code, { field })
    return parsedId
}

function getJudgeId(c: Context): number {
    return (c.var["authenticatedUserTokenPayload"] as TokenPayload).sub
}

export async function validateGetRoundContestantsInput(c: Context, next: Next) {
    const id = parsePositiveIdParam(c, "SCORING_ROUND_ID_INVALID", "get_round_contestants_input_id")
    c.set("getRoundContestantsInput", { id })
    await next()
}

export async function validateGetCategoryScoringFieldsInput(c: Context, next: Next) {
    const id = parsePositiveIdParam(c, "SCORING_CATEGORY_ID_INVALID", "get_category_scoring_fields_input_id")
    c.set("getCategoryScoringFieldsInput", { id })
    await next()
}

export async function validateGetMyCategoryScoresInput(c: Context, next: Next) {
    const id = parsePositiveIdParam(c, "SCORING_CATEGORY_ID_INVALID", "get_my_category_scores_input_id")
    const judgeId = getJudgeId(c)

    c.set("getMyCategoryScoresInput", { id, judgeId })
    await next()
}

export async function validateSubmitCategoryScoresInput(c: Context, next: Next) {
    const id = parsePositiveIdParam(c, "SCORING_CATEGORY_ID_INVALID", "submit_category_scores_input_id")
    const { scores } = await c.req.json<SubmitCategoryScoresRequestBody>()

    if (!Array.isArray(scores) || scores.length === 0) {
        throw new AppError("SCORING_SCORES_REQUIRED", { field: "submit_category_scores_input_scores" })
    }

    const parsedScores: SubmitCategoryScoreEntry[] = scores.map((entry, index) => {
        if (typeof entry !== "object" || entry === null) {
            throw new AppError("SCORING_SCORE_ENTRY_INVALID", { field: `submit_category_scores_input_scores_${index}` })
        }

        const { contestantId, criteriaFieldId, value } = entry as Record<string, unknown>

        if (!isPositiveInteger(contestantId) || !isPositiveInteger(criteriaFieldId)) {
            throw new AppError("SCORING_SCORE_ENTRY_INVALID", { field: `submit_category_scores_input_scores_${index}` })
        }
        if (!isValidScoreValue(value)) {
            throw new AppError("SCORING_VALUE_INVALID", { field: `submit_category_scores_input_scores_${index}_value` })
        }

        return {
            contestantId: contestantId as number,
            criteriaFieldId: criteriaFieldId as number,
            value: (value as string).trim(),
        }
    })

    const seenPairs = new Set<string>()
    for (const score of parsedScores) {
        const key = `${score.contestantId}-${score.criteriaFieldId}`
        if (seenPairs.has(key)) {
            throw new AppError("SCORING_DUPLICATE_ENTRY", { field: "submit_category_scores_input_scores" })
        }
        seenPairs.add(key)
    }

    const judgeId = getJudgeId(c)
    c.set("submitCategoryScoresInput", { id, judgeId, scores: parsedScores })
    await next()
}
