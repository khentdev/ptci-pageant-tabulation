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
    PLACEMENT_ORDER_INVALID: "PLACEMENT_ORDER_INVALID",
    PLACEMENT_ORDER_ID_INVALID: "PLACEMENT_ORDER_ID_INVALID",
    PLACEMENT_ORDER_IDS_DUPLICATE: "PLACEMENT_ORDER_IDS_DUPLICATE",
    PLACEMENT_ORDER_NOT_ALLOWED: "PLACEMENT_ORDER_NOT_ALLOWED",
    PLACEMENT_ORDER_REQUIRED: "PLACEMENT_ORDER_REQUIRED",
    PLACEMENT_ORDER_MISMATCH: "PLACEMENT_ORDER_MISMATCH",
    ADVANCE_NOT_ALLOWED: "ADVANCE_NOT_ALLOWED",
    ADVANCE_CONTESTANT_COUNT_MISMATCH: "ADVANCE_CONTESTANT_COUNT_MISMATCH",
    ADVANCE_REQUIRES_CHAIRMAN: "ADVANCE_REQUIRES_CHAIRMAN",
    ROUND_ADVANCEMENT_ERROR: "ROUND_ADVANCEMENT_ERROR",
    DECLARE_NOT_ALLOWED: "DECLARE_NOT_ALLOWED",
    DECLARE_WINNER_COUNT_MISMATCH: "DECLARE_WINNER_COUNT_MISMATCH",
    DECLARE_REQUIRES_CHAIRMAN: "DECLARE_REQUIRES_CHAIRMAN",
    CHAIRMAN_ACTION_REQUIRES_TIE: "CHAIRMAN_ACTION_REQUIRES_TIE",
    DECLARE_WINNERS_ERROR: "DECLARE_WINNERS_ERROR",
    DECLARED_WINNERS_GET_ERROR: "DECLARED_WINNERS_GET_ERROR",
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
    PLACEMENT_ORDER_INVALID: {
        code: "PLACEMENT_ORDER_INVALID",
        message: "Placement order is invalid.",
        status: 400
    },
    PLACEMENT_ORDER_ID_INVALID: {
        code: "PLACEMENT_ORDER_ID_INVALID",
        message: "Placement order contestant ID is invalid.",
        status: 400
    },
    PLACEMENT_ORDER_IDS_DUPLICATE: {
        code: "PLACEMENT_ORDER_IDS_DUPLICATE",
        message: "Placement order contestant IDs are duplicate.",
        status: 400
    },
    PLACEMENT_ORDER_NOT_ALLOWED: {
        code: "PLACEMENT_ORDER_NOT_ALLOWED",
        message: "Placement order is not allowed when there is no placement tie.",
        status: 400
    },
    PLACEMENT_ORDER_REQUIRED: {
        code: "PLACEMENT_ORDER_REQUIRED",
        message: "Placement order is required to resolve a score tie.",
        status: 400
    },
    PLACEMENT_ORDER_MISMATCH: {
        code: "PLACEMENT_ORDER_MISMATCH",
        message: "Placement order must include exactly the tied contestants, with no extras or omissions.",
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
    ADVANCE_REQUIRES_CHAIRMAN: {
        code: "ADVANCE_REQUIRES_CHAIRMAN",
        message: "This round has a tie. Only the Chairman can resolve it and advance.",
        status: 409
    },
    ROUND_ADVANCEMENT_ERROR: {
        code: "ROUND_ADVANCEMENT_ERROR",
        message: "Unable to advance round.",
        status: 500
    },
    DECLARE_NOT_ALLOWED: {
        code: "DECLARE_NOT_ALLOWED",
        message: "Winners cannot be declared at this time.",
        status: 409
    },
    DECLARE_WINNER_COUNT_MISMATCH: {
        code: "DECLARE_WINNER_COUNT_MISMATCH",
        message: "Declared winner count does not match the round limit.",
        status: 400
    },
    DECLARE_REQUIRES_CHAIRMAN: {
        code: "DECLARE_REQUIRES_CHAIRMAN",
        message: "This round has a tie. Only the Chairman can resolve it and declare winners.",
        status: 409
    },
    CHAIRMAN_ACTION_REQUIRES_TIE: {
        code: "CHAIRMAN_ACTION_REQUIRES_TIE",
        message: "There is no tie to resolve. The Chairman can only act when a tie exists.",
        status: 409
    },
    DECLARE_WINNERS_ERROR: {
        code: "DECLARE_WINNERS_ERROR",
        message: "Unable to declare winners.",
        status: 500
    },
    DECLARED_WINNERS_GET_ERROR: {
        code: "DECLARED_WINNERS_GET_ERROR",
        message: "Unable to get declared winners.",
        status: 500
    }
}

export type LiveEventErrorCodes = keyof typeof LIVE_EVENT_ERROR_CODES
