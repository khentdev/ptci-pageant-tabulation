import type { ErrorDefinitions } from "../../errors/index.js"

export const CATEGORY_ERROR_CODES = {
    CATEGORY_NAME_INVALID: "CATEGORY_NAME_INVALID",
    CATEGORY_ROUND_ID_INVALID: "CATEGORY_ROUND_ID_INVALID",
    CATEGORY_ADD_ERROR: "CATEGORY_ADD_ERROR",
} as const

export const CATEGORY_ERROR_DEF: Record<CategoryErrorCodes, ErrorDefinitions> = {
    CATEGORY_NAME_INVALID: {
        code: "CATEGORY_NAME_INVALID",
        message: "Category name is invalid",
        status: 400,
    },
    CATEGORY_ROUND_ID_INVALID: {
        code: "CATEGORY_ROUND_ID_INVALID",
        message: "Category round id is invalid",
        status: 400,
    },
    CATEGORY_ADD_ERROR: {
        code: "CATEGORY_ADD_ERROR",
        message: "Error adding category",
        status: 500,
    }
}

export type CategoryErrorCodes = keyof typeof CATEGORY_ERROR_CODES