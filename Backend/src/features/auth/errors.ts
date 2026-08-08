import type { ErrorDefinitions } from "../../errors/index.js";

export const AUTH_ERROR_CODES = {
INVALID_DEVICE_ID: "INVALID_DEVICE_ID",
INVALID_USERNAME: "INVALID_USERNAME",
INVALID_PASSWORD: "INVALID_PASSWORD",
INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
} as const

export const AUTH_ERROR_DEF: Record<AuthErrorCodes, ErrorDefinitions> = {
    INVALID_DEVICE_ID: {
        code: "INVALID_DEVICE_ID",
        message: "Unable to verify your device. Please refresh the page and try again.",
        status: 400,
    },
    INVALID_USERNAME: {
        code: "INVALID_USERNAME",
        message: "Username is required.",
        status: 400,
    },
    INVALID_PASSWORD: {
        code: "INVALID_PASSWORD",
        message: "Password is required.",
        status: 400,
    },
    INVALID_CREDENTIALS: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid username or password. Please try again.",
        status: 401,
    },
} as const

export type AuthErrorCodes = keyof typeof AUTH_ERROR_CODES