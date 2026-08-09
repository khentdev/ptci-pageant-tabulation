import type { ErrorDefinitions } from "../../errors/index.js"

export const ROUND_ERROR_CODES = {
    ROUND_NAME_INVALID: "ROUND_NAME_INVALID",
    ROUND_PHASE_ORDER_INVALID: "ROUND_PHASE_ORDER_INVALID",
    ROUND_CONTESTANT_LIMIT_INVALID: "ROUND_CONTESTANT_LIMIT_INVALID",
    ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS: "ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS",
    ROUND_PHASE_ORDER_ALREADY_EXISTS: "ROUND_PHASE_ORDER_ALREADY_EXISTS",
    ROUND_PHASE_ORDER_DUPLICATE: "ROUND_PHASE_ORDER_DUPLICATE",
    ROUND_CONTESTANT_LIMIT_REQUIRED: "ROUND_CONTESTANT_LIMIT_REQUIRED",
    ROUND_PHASE_ADD_ERROR: "ROUND_PHASE_ADD_ERROR",
    ROUND_PHASE_GET_LIST_ERROR: "ROUND_PHASE_GET_LIST_ERROR",
    ROUND_PHASE_GET_BY_ID_ERROR: "ROUND_PHASE_GET_BY_ID_ERROR",
    ROUND_PHASE_EDIT_ERROR: "ROUND_PHASE_EDIT_ERROR",
    ROUND_ID_INVALID: "ROUND_ID_INVALID",
    ROUND_PHASE_NOT_FOUND: "ROUND_PHASE_NOT_FOUND",
    ROUND_CONTESTANT_LIMIT_LOCKED: "ROUND_CONTESTANT_LIMIT_LOCKED",
    ROUND_PRELIMINARY_LIMIT_LOCKED: "ROUND_PRELIMINARY_LIMIT_LOCKED",
    ROUND_PHASE_CATEGORY_LOCKED: "ROUND_PHASE_CATEGORY_LOCKED",
    ROUND_PHASE_HAS_CONTESTANTS: "ROUND_PHASE_HAS_CONTESTANTS",
    ROUND_PHASE_DELETE_ERROR: "ROUND_PHASE_DELETE_ERROR"
} as const

export const ROUND_ERROR_DEF: Record<RoundErrorCodes, ErrorDefinitions> = {
    ROUND_NAME_INVALID: {
        code: "ROUND_NAME_INVALID",
        message: "Round name is required.",
        status: 400,
    },
    ROUND_PHASE_ORDER_INVALID: {
        code: "ROUND_PHASE_ORDER_INVALID",
        message: "Phase order must be a positive whole number.",
        status: 400,
    },
    ROUND_CONTESTANT_LIMIT_INVALID: {
        code: "ROUND_CONTESTANT_LIMIT_INVALID",
        message: "Contestant limit must be a positive whole number.",
        status: 400,
    },
    ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS: {
        code: "ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS",
        message: "There is no preliminary round exists. Please create first round first.",
        status: 400,
    },
    ROUND_PHASE_ORDER_ALREADY_EXISTS: {
        code: "ROUND_PHASE_ORDER_ALREADY_EXISTS",
        message: "The first round has already been created. Please create a new round with a higher phase order.",
        status: 400,
    },
    ROUND_PHASE_ORDER_DUPLICATE: {
        code: "ROUND_PHASE_ORDER_DUPLICATE",
        message: "A round with this phase order already exists. Please use a different phase order.",
        status: 400,
    },
    ROUND_CONTESTANT_LIMIT_REQUIRED: {
        code: "ROUND_CONTESTANT_LIMIT_REQUIRED",
        message: "Contestant limit is required for rounds after the preliminary round.",
        status: 400,
    },
    ROUND_PHASE_ADD_ERROR: {
        code: "ROUND_PHASE_ADD_ERROR",
        message: "Unable to add round phase. Please try again later.",
        status: 500,
    },
    ROUND_PHASE_GET_LIST_ERROR: {
        code: "ROUND_PHASE_GET_LIST_ERROR",
        message: "Unable to get round phases. Please try again later.",
        status: 500,
    },
    ROUND_PHASE_GET_BY_ID_ERROR: {
        code: "ROUND_PHASE_GET_BY_ID_ERROR",
        message: "Unable to get round phase. Please try again later.",
        status: 500,
    },
    ROUND_PHASE_EDIT_ERROR: {
        code: "ROUND_PHASE_EDIT_ERROR",
        message: "Unable to edit round phase. Please try again later.",
        status: 500,
    },
    ROUND_ID_INVALID: {
        code: "ROUND_ID_INVALID",
        message: "Round ID must be a valid number.",
        status: 400,
    },
    ROUND_PHASE_NOT_FOUND: {
        code: "ROUND_PHASE_NOT_FOUND",
        message: "Round phase not found.",
        status: 404,
    },
    ROUND_CONTESTANT_LIMIT_LOCKED: {
        code: "ROUND_CONTESTANT_LIMIT_LOCKED",
        message: "Contestant limit cannot be changed after contestants have advanced into this round",
        status: 400,
    },
    ROUND_PRELIMINARY_LIMIT_LOCKED: {
        code: "ROUND_PRELIMINARY_LIMIT_LOCKED",
        message: "Preliminary round contestant limit is always unlimited.",
        status: 400,
    },
    ROUND_PHASE_CATEGORY_LOCKED: {
        code: "ROUND_PHASE_CATEGORY_LOCKED",
        message: "Round phase cannot be deleted because it has categories.",
        status: 400,
    },
    ROUND_PHASE_HAS_CONTESTANTS: {
        code: "ROUND_PHASE_HAS_CONTESTANTS",
        message: "Round phase cannot be deleted because it has contestants.",
        status: 400,
    },
    ROUND_PHASE_DELETE_ERROR: {
        code: "ROUND_PHASE_DELETE_ERROR",
        message: "Unable to delete round phase. Please try again later.",
        status: 500,
    }
}
export type RoundErrorCodes = keyof typeof ROUND_ERROR_CODES
