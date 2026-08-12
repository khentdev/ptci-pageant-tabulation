import type { ErrorDefinitions } from "../../errors/index.js"

export const CATEGORY_ERROR_CODES = {
    CATEGORY_NAME_REQUIRED: "CATEGORY_NAME_REQUIRED",
    CATEGORY_ROUND_ID_REQUIRED: "CATEGORY_ROUND_ID_REQUIRED",
    CATEGORY_ROUND_ID_INVALID: "CATEGORY_ROUND_ID_INVALID",
    CATEGORY_ADD_ERROR: "CATEGORY_ADD_ERROR",
    CATEGORY_ID_INVALID: "CATEGORY_ID_INVALID",
    CATEGORY_EDIT_ERROR: "CATEGORY_EDIT_ERROR",
    CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
    CATEGORY_LOCKED: "CATEGORY_LOCKED",
    CATEGORY_GET_BY_ID_ERROR: "CATEGORY_GET_BY_ID_ERROR",
    CATEGORY_GET_LIST_ERROR: "CATEGORY_GET_LIST_ERROR",
    CATEGORY_FIELDS_REQUIRED: "CATEGORY_FIELDS_REQUIRED",
    CATEGORY_FIELD_NAME_REQUIRED: "CATEGORY_FIELD_NAME_REQUIRED",
    CATEGORY_FIELD_MAX_VALUE_REQUIRED: "CATEGORY_FIELD_MAX_VALUE_REQUIRED",
    CATEGORY_FIELD_MAX_VALUE_INVALID: "CATEGORY_FIELD_MAX_VALUE_INVALID",
    CATEGORY_FIELDS_TOTAL_INVALID: "CATEGORY_FIELDS_TOTAL_INVALID",
    CATEGORY_FIELDS_SAVE_ERROR: "CATEGORY_FIELDS_SAVE_ERROR",
    CATEGORY_FIELDS_GET_ERROR: "CATEGORY_FIELDS_GET_ERROR",
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
    },
    CATEGORY_ID_INVALID: {
        code: "CATEGORY_ID_INVALID",
        message: "Category ID must be a valid number.",
        status: 400,
    },
    CATEGORY_EDIT_ERROR: {
        code: "CATEGORY_EDIT_ERROR",
        message: "Unable to edit category.",
        status: 500,
    },
    CATEGORY_NOT_FOUND: {
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
        status: 404,
    },
    CATEGORY_LOCKED: {
        code: "CATEGORY_LOCKED",
        message: "Category cannot be edited because scores already exist for this category.",
        status: 400,
    },
    CATEGORY_GET_BY_ID_ERROR: {
        code: "CATEGORY_GET_BY_ID_ERROR",
        message: "Unable to get category by id.",
        status: 500,
    },
    CATEGORY_GET_LIST_ERROR: {
        code: "CATEGORY_GET_LIST_ERROR",
        message: "Unable to get category list.",
        status: 500,
    },
    CATEGORY_FIELDS_REQUIRED: {
        code: "CATEGORY_FIELDS_REQUIRED",
        message: "Add at least one scoring field.",
        status: 400,
    },
    CATEGORY_FIELD_NAME_REQUIRED: {
        code: "CATEGORY_FIELD_NAME_REQUIRED",
        message: "Field name is required.",
        status: 400,
    },
    CATEGORY_FIELD_MAX_VALUE_REQUIRED: {
        code: "CATEGORY_FIELD_MAX_VALUE_REQUIRED",
        message: "Max score is required.",
        status: 400,
    },
    CATEGORY_FIELD_MAX_VALUE_INVALID: {
        code: "CATEGORY_FIELD_MAX_VALUE_INVALID",
        message: "Max score must be at least 1 with up to 2 decimal places.",
        status: 400,
    },
    CATEGORY_FIELDS_TOTAL_INVALID: {
        code: "CATEGORY_FIELDS_TOTAL_INVALID",
        message: "Scoring fields must total exactly 100.",
        status: 400,
    },
    CATEGORY_FIELDS_SAVE_ERROR: {
        code: "CATEGORY_FIELDS_SAVE_ERROR",
        message: "Unable to save scoring fields.",
        status: 500,
    },
    CATEGORY_FIELDS_GET_ERROR: {
        code: "CATEGORY_FIELDS_GET_ERROR",
        message: "Unable to get category fields.",
        status: 500,
    },
}

export type CategoryErrorCodes = keyof typeof CATEGORY_ERROR_CODES