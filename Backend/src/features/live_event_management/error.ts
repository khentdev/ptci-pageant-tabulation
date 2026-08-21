import type { ErrorDefinitions } from "../../errors/index.js"

export const LIVE_EVENT_ERROR_CODES = {
    JUDGE_SUBMISSIONS_GET_ERROR: "JUDGE_SUBMISSIONS_GET_ERROR",
} as const

export const LIVE_EVENT_ERROR_DEF: Record<LiveEventErrorCodes, ErrorDefinitions> = {
    JUDGE_SUBMISSIONS_GET_ERROR: {
        code: "JUDGE_SUBMISSIONS_GET_ERROR",
        message: "Unable to get judge submissions.",
        status: 500
    }
}

export type LiveEventErrorCodes = keyof typeof LIVE_EVENT_ERROR_CODES
