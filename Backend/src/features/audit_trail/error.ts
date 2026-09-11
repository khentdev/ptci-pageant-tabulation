import type { ErrorDefinitions } from "../../errors/index.js"

export const AUDIT_TRAIL_ERROR_CODES = {
    AUDIT_LOGS_GET_ERROR: "AUDIT_LOGS_GET_ERROR",
} as const

export const AUDIT_TRAIL_ERROR_DEF: Record<AuditTrailErrorCodes, ErrorDefinitions> = {
    AUDIT_LOGS_GET_ERROR: {
        code: "AUDIT_LOGS_GET_ERROR",
        message: "Unable to get audit logs. Please try again later.",
        status: 500,
    },
}

export type AuditTrailErrorCodes = keyof typeof AUDIT_TRAIL_ERROR_CODES
