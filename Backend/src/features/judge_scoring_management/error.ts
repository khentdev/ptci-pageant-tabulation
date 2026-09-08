import type { ErrorDefinitions } from "../../errors/index.js"

export const SCORING_ERROR_CODES = {
    SCORING_ROUND_ID_INVALID: "SCORING_ROUND_ID_INVALID",
    SCORING_CATEGORY_ID_INVALID: "SCORING_CATEGORY_ID_INVALID",
    SCORING_ROUND_NOT_FOUND: "SCORING_ROUND_NOT_FOUND",
    SCORING_CATEGORY_NOT_FOUND: "SCORING_CATEGORY_NOT_FOUND",
    SCORING_SCORES_REQUIRED: "SCORING_SCORES_REQUIRED",
    SCORING_SCORE_ENTRY_INVALID: "SCORING_SCORE_ENTRY_INVALID",
    SCORING_VALUE_INVALID: "SCORING_VALUE_INVALID",
    SCORING_DUPLICATE_ENTRY: "SCORING_DUPLICATE_ENTRY",
    SCORING_CATEGORY_NO_FIELDS: "SCORING_CATEGORY_NO_FIELDS",
    SCORING_ROUND_NO_CONTESTANTS: "SCORING_ROUND_NO_CONTESTANTS",
    SCORING_CONTESTANT_NOT_IN_ROUND: "SCORING_CONTESTANT_NOT_IN_ROUND",
    SCORING_FIELD_NOT_IN_CATEGORY: "SCORING_FIELD_NOT_IN_CATEGORY",
    SCORING_SCORES_INCOMPLETE: "SCORING_SCORES_INCOMPLETE",
    SCORING_VALUE_OUT_OF_RANGE: "SCORING_VALUE_OUT_OF_RANGE",
    SCORING_ALREADY_SUBMITTED: "SCORING_ALREADY_SUBMITTED",
    SCORING_ROUND_LOCKED: "SCORING_ROUND_LOCKED",
    SCORING_ROUND_COMPLETED: "SCORING_ROUND_COMPLETED",
    SCORING_ROUNDS_GET_ERROR: "SCORING_ROUNDS_GET_ERROR",
    SCORING_CONTESTANTS_GET_ERROR: "SCORING_CONTESTANTS_GET_ERROR",
    SCORING_FIELDS_GET_ERROR: "SCORING_FIELDS_GET_ERROR",
    SCORING_SCORES_GET_ERROR: "SCORING_SCORES_GET_ERROR",
    SCORING_SUBMIT_ERROR: "SCORING_SUBMIT_ERROR",
} as const

export const SCORING_ERROR_DEF: Record<ScoringErrorCodes, ErrorDefinitions> = {
    SCORING_ROUND_ID_INVALID: {
        code: "SCORING_ROUND_ID_INVALID",
        message: "Round ID must be a positive whole number.",
        status: 400,
    },
    SCORING_CATEGORY_ID_INVALID: {
        code: "SCORING_CATEGORY_ID_INVALID",
        message: "Category ID must be a positive whole number.",
        status: 400,
    },
    SCORING_ROUND_NOT_FOUND: {
        code: "SCORING_ROUND_NOT_FOUND",
        message: "Round not found.",
        status: 404,
    },
    SCORING_CATEGORY_NOT_FOUND: {
        code: "SCORING_CATEGORY_NOT_FOUND",
        message: "Category not found.",
        status: 404,
    },
    SCORING_SCORES_REQUIRED: {
        code: "SCORING_SCORES_REQUIRED",
        message: "At least one score is required.",
        status: 400,
    },
    SCORING_SCORE_ENTRY_INVALID: {
        code: "SCORING_SCORE_ENTRY_INVALID",
        message: "Each score must include a valid contestant, field, and value.",
        status: 400,
    },
    SCORING_VALUE_INVALID: {
        code: "SCORING_VALUE_INVALID",
        message: "Score value must be a number with at most 2 decimal places.",
        status: 400,
    },
    SCORING_DUPLICATE_ENTRY: {
        code: "SCORING_DUPLICATE_ENTRY",
        message: "Duplicate score entry for the same contestant and field.",
        status: 400,
    },
    SCORING_CATEGORY_NO_FIELDS: {
        code: "SCORING_CATEGORY_NO_FIELDS",
        message: "This category has no scoring fields yet.",
        status: 400,
    },
    SCORING_ROUND_NO_CONTESTANTS: {
        code: "SCORING_ROUND_NO_CONTESTANTS",
        message: "This round has no contestants yet.",
        status: 400,
    },
    SCORING_CONTESTANT_NOT_IN_ROUND: {
        code: "SCORING_CONTESTANT_NOT_IN_ROUND",
        message: "A submitted contestant is not part of this round.",
        status: 400,
    },
    SCORING_FIELD_NOT_IN_CATEGORY: {
        code: "SCORING_FIELD_NOT_IN_CATEGORY",
        message: "A submitted field does not belong to this category.",
        status: 400,
    },
    SCORING_SCORES_INCOMPLETE: {
        code: "SCORING_SCORES_INCOMPLETE",
        message: "All fields for all contestants must be filled before submitting.",
        status: 400,
    },
    SCORING_VALUE_OUT_OF_RANGE: {
        code: "SCORING_VALUE_OUT_OF_RANGE",
        message: "Score value must be between 0 and the field's maximum.",
        status: 400,
    },
    SCORING_ALREADY_SUBMITTED: {
        code: "SCORING_ALREADY_SUBMITTED",
        message: "Scores for this category have already been submitted.",
        status: 400,
    },
    SCORING_ROUND_LOCKED: {
        code: "SCORING_ROUND_LOCKED",
        message: "Winners for this round have already been declared.",
        status: 400,
    },
    SCORING_ROUND_COMPLETED: {
        code: "SCORING_ROUND_COMPLETED",
        message: "This round has already been completed.",
        status: 400,
    },
    SCORING_ROUNDS_GET_ERROR: {
        code: "SCORING_ROUNDS_GET_ERROR",
        message: "Unable to get rounds.",
        status: 500,
    },
    SCORING_CONTESTANTS_GET_ERROR: {
        code: "SCORING_CONTESTANTS_GET_ERROR",
        message: "Unable to get contestants.",
        status: 500,
    },
    SCORING_FIELDS_GET_ERROR: {
        code: "SCORING_FIELDS_GET_ERROR",
        message: "Unable to get scoring fields.",
        status: 500,
    },
    SCORING_SCORES_GET_ERROR: {
        code: "SCORING_SCORES_GET_ERROR",
        message: "Unable to get scores.",
        status: 500,
    },
    SCORING_SUBMIT_ERROR: {
        code: "SCORING_SUBMIT_ERROR",
        message: "Unable to submit scores.",
        status: 500,
    },
}

export type ScoringErrorCodes = keyof typeof SCORING_ERROR_CODES
