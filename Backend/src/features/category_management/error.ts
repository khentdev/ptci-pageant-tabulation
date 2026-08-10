import type { ErrorDefinitions } from "../../errors/index.js"

export const CATEGORY_ERROR_CODES = {
    CATEGORY_NAME_REQUIRED: "CATEGORY_NAME_REQUIRED",
    CATEGORY_ROUND_ID_REQUIRED: "CATEGORY_ROUND_ID_REQUIRED",
    CATEGORY_ROUND_ID_INVALID: "CATEGORY_ROUND_ID_INVALID",
    CATEGORY_ADD_ERROR: "CATEGORY_ADD_ERROR",
} as const

export const CATEGORY_ERROR_DEF: Record<CategoryErrorCodes, ErrorDefinitions> = {
    CATEGORY_NAME_REQUIRED: {
        code: "CATEGORY_NAME_REQUIRED",
        message: "Category name is required.",
        status: 400,
    },
    CATEGORY_ROUND_ID_REQUIRED: {
        code: "CATEGORY_ROUND_ID_REQUIRED",
        message: "Select a round to add a category.",
        status: 400,
    },
    CATEGORY_ROUND_ID_INVALID: {
        code: "CATEGORY_ROUND_ID_INVALID",
        message: "Invalid round id.",
        status: 400,
    },
    CATEGORY_ADD_ERROR: {
        code: "CATEGORY_ADD_ERROR",
        message: "Unable to add category.",
        status: 500,
    }
}

export type CategoryErrorCodes = keyof typeof CATEGORY_ERROR_CODES