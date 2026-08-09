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
}
export type RoundErrorCodes = keyof typeof ROUND_ERROR_CODES
