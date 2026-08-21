import type { ErrorDefinitions } from "../../errors/index.js"

export const LIVE_EVENT_ERROR_CODES = {
    JUDGE_SUBMISSIONS_GET_ERROR: "JUDGE_SUBMISSIONS_GET_ERROR",
    ROUND_RESULTS_GET_ERROR: "ROUND_RESULTS_GET_ERROR",
    SELECTED_CONTESTANT_IDS_INVALID: "SELECTED_CONTESTANT_IDS_INVALID",
    SELECTED_CONTESTANT_ID_INVALID: "SELECTED_CONTESTANT_ID_INVALID",
    SELECTED_CONTESTANT_IDS_DUPLICATE: "SELECTED_CONTESTANT_IDS_DUPLICATE",
    SELECTED_CONTESTANT_IDS_NOT_ALLOWED: "SELECTED_CONTESTANT_IDS_NOT_ALLOWED",
    SELECTED_CONTESTANT_IDS_REQUIRED: "SELECTED_CONTESTANT_IDS_REQUIRED",
    SELECTED_CONTESTANT_IDS_COUNT_INVALID: "SELECTED_CONTESTANT_IDS_COUNT_INVALID",
    SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP: "SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP",
    ADVANCE_NOT_ALLOWED: "ADVANCE_NOT_ALLOWED",
    ADVANCE_CONTESTANT_COUNT_MISMATCH: "ADVANCE_CONTESTANT_COUNT_MISMATCH",
    ROUND_ADVANCEMENT_ERROR: "ROUND_ADVANCEMENT_ERROR",
} as const

export const LIVE_EVENT_ERROR_DEF: Record<LiveEventErrorCodes, ErrorDefinitions> = {
    JUDGE_SUBMISSIONS_GET_ERROR: {
        code: "JUDGE_SUBMISSIONS_GET_ERROR",
        message: "Unable to get judge submissions.",
        status: 500
    },
    ROUND_RESULTS_GET_ERROR: {
        code: "ROUND_RESULTS_GET_ERROR",
        message: "Unable to get round results.",
        status: 500
    },
    SELECTED_CONTESTANT_IDS_INVALID: {
        code: "SELECTED_CONTESTANT_IDS_INVALID",
        message: "Selected contestant IDs are invalid.",
        status: 400
    },
    SELECTED_CONTESTANT_ID_INVALID: {
        code: "SELECTED_CONTESTANT_ID_INVALID",
        message: "Selected contestant ID is invalid.",
        status: 400
    },
    SELECTED_CONTESTANT_IDS_DUPLICATE: {
        code: "SELECTED_CONTESTANT_IDS_DUPLICATE",
        message: "Selected contestant IDs are duplicate.",
        status: 400
    },
    SELECTED_CONTESTANT_IDS_NOT_ALLOWED: {
        code: "SELECTED_CONTESTANT_IDS_NOT_ALLOWED",
        message: "Selected contestant IDs are not allowed when there is no tie.",
        status: 400
    },
    SELECTED_CONTESTANT_IDS_REQUIRED: {
        code: "SELECTED_CONTESTANT_IDS_REQUIRED",
        message: "Selected contestant IDs are required to resolve a tie.",
        status: 400
    },
    SELECTED_CONTESTANT_IDS_COUNT_INVALID: {
        code: "SELECTED_CONTESTANT_IDS_COUNT_INVALID",
        message: "Selected contestant count does not match the required tie selections.",
        status: 400
    },
    SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP: {
        code: "SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP",
        message: "One or more selected contestants are not in the tied group.",
        status: 400
    },
    ADVANCE_NOT_ALLOWED: {
        code: "ADVANCE_NOT_ALLOWED",
        message: "Round cannot be advanced at this time.",
        status: 409
    },
    ADVANCE_CONTESTANT_COUNT_MISMATCH: {
        code: "ADVANCE_CONTESTANT_COUNT_MISMATCH",
        message: "Advancing contestant count does not match the next round limit.",
        status: 400
    },
    ROUND_ADVANCEMENT_ERROR: {
        code: "ROUND_ADVANCEMENT_ERROR",
        message: "Unable to advance round.",
        status: 500
    }
}

export type LiveEventErrorCodes = keyof typeof LIVE_EVENT_ERROR_CODES
