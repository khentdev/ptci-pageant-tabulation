import type { ErrorDefinitions } from "../../errors/index.js"

export const JUDGE_ERROR_CODES = {
    JUDGE_USERNAME_EXISTS: "JUDGE_USERNAME_EXISTS",
    JUDGE_NAME_TOO_SHORT: "JUDGE_NAME_TOO_SHORT",
    JUDGE_USERNAME_TOO_SHORT: "JUDGE_USERNAME_TOO_SHORT",
    JUDGE_PASSWORD_TOO_SHORT: "JUDGE_PASSWORD_TOO_SHORT",
    JUDGE_ADD_FAILED: "JUDGE_ADD_FAILED",
    JUDGE_GET_LIST_FAILED: "JUDGE_GET_LIST_FAILED",
} as const

export const JUDGE_ERROR_DEF: Record<JudgeErrorCodes, ErrorDefinitions> = {
    JUDGE_USERNAME_EXISTS: {
        code: "JUDGE_USERNAME_EXISTS",
        message: "Username already exists.",
        status: 400,
    },
    JUDGE_NAME_TOO_SHORT: {
        code: "JUDGE_NAME_TOO_SHORT",
        message: "Name must be at least 3 characters long.",
        status: 400,
    },
    JUDGE_USERNAME_TOO_SHORT: {
        code: "JUDGE_USERNAME_TOO_SHORT",
        message: "Username must be at least 3 characters long.",
        status: 400,
    },
    JUDGE_PASSWORD_TOO_SHORT: {
        code: "JUDGE_PASSWORD_TOO_SHORT",
        message: "Password must be at least 8 characters long.",
        status: 400,
    },
    JUDGE_ADD_FAILED: {
        code: "JUDGE_ADD_FAILED",
        message: "Unable to add judge.",
        status: 500,
    },
    JUDGE_GET_LIST_FAILED: {
        code: "JUDGE_GET_LIST_FAILED",
        message: "Unable to get judge list.",
        status: 500,
    },
}

export type JudgeErrorCodes = keyof typeof JUDGE_ERROR_CODES