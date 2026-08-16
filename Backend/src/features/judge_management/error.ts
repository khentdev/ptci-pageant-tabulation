import type { ErrorDefinitions } from "../../errors/index.js"

export const JUDGE_ERROR_CODES = {
    JUDGE_USERNAME_EXISTS: "JUDGE_USERNAME_EXISTS",
    JUDGE_NAME_TOO_SHORT: "JUDGE_NAME_TOO_SHORT",
    JUDGE_USERNAME_TOO_SHORT: "JUDGE_USERNAME_TOO_SHORT",
    JUDGE_PASSWORD_TOO_SHORT: "JUDGE_PASSWORD_TOO_SHORT",
    JUDGE_ID_INVALID: "JUDGE_ID_INVALID",
    JUDGE_NOT_FOUND: "JUDGE_NOT_FOUND",
    JUDGE_LOCKED: "JUDGE_LOCKED",
    JUDGE_ADD_FAILED: "JUDGE_ADD_FAILED",
    JUDGE_GET_LIST_FAILED: "JUDGE_GET_LIST_FAILED",
    JUDGE_EDIT_FAILED: "JUDGE_EDIT_FAILED",
    JUDGE_RESET_PASSWORD_FAILED: "JUDGE_RESET_PASSWORD_FAILED",
    JUDGE_DELETE_FAILED: "JUDGE_DELETE_FAILED",
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
    JUDGE_ID_INVALID: {
        code: "JUDGE_ID_INVALID",
        message: "Judge ID must be a positive whole number.",
        status: 400,
    },
    JUDGE_NOT_FOUND: {
        code: "JUDGE_NOT_FOUND",
        message: "Judge not found.",
        status: 404,
    },
    JUDGE_LOCKED: {
        code: "JUDGE_LOCKED",
        message: "Judge cannot be deleted because scores already exist.",
        status: 400,
    },
    JUDGE_EDIT_FAILED: {
        code: "JUDGE_EDIT_FAILED",
        message: "Unable to edit judge.",
        status: 500,
    },
    JUDGE_RESET_PASSWORD_FAILED: {
        code: "JUDGE_RESET_PASSWORD_FAILED",
        message: "Unable to reset judge password.",
        status: 500,
    },
    JUDGE_DELETE_FAILED: {
        code: "JUDGE_DELETE_FAILED",
        message: "Unable to delete judge.",
        status: 500,
    },
}

export type JudgeErrorCodes = keyof typeof JUDGE_ERROR_CODES