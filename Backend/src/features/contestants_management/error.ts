import type { ErrorDefinitions } from "../../errors/index.js"

export const CONTESTANT_ERROR_CODES = {
    CONTESTANT_CANDIDATE_NUMBER_REQUIRED: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
    CONTESTANT_CANDIDATE_NUMBER_INVALID: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
    CONTESTANT_CANDIDATE_NUMBER_DUPLICATE: "CONTESTANT_CANDIDATE_NUMBER_DUPLICATE",
    CONTESTANT_NAME_REQUIRED: "CONTESTANT_NAME_REQUIRED",
    CONTESTANT_GENDER_REQUIRED: "CONTESTANT_GENDER_REQUIRED",
    CONTESTANT_GENDER_INVALID: "CONTESTANT_GENDER_INVALID",
    CONTESTANT_TEAM_NAME_REQUIRED: "CONTESTANT_TEAM_NAME_REQUIRED",
    CONTESTANT_TEAM_COLOR_REQUIRED: "CONTESTANT_TEAM_COLOR_REQUIRED",
    CONTESTANT_ADD_ERROR: "CONTESTANT_ADD_ERROR",
    CONTESTANT_GET_ALL_ERROR: "CONTESTANT_GET_ALL_ERROR",
    CONTESTANT_GET_BY_ID_ERROR: "CONTESTANT_GET_BY_ID_ERROR",
    CONTESTANT_FILTER_INVALID: "CONTESTANT_FILTER_INVALID",
    CONTESTANT_ID_REQUIRED: "CONTESTANT_ID_REQUIRED",
    CONTESTANT_ID_INVALID: "CONTESTANT_ID_INVALID",
    CONTESTANT_NOT_FOUND: "CONTESTANT_NOT_FOUND",
    CONTESTANT_LOCKED: "CONTESTANT_LOCKED",
    CONTESTANT_EDIT_ERROR: "CONTESTANT_EDIT_ERROR",
    CONTESTANT_DELETE_ERROR: "CONTESTANT_DELETE_ERROR",
} as const

export const CONTESTANT_ERROR_DEF: Record<ContestantErrorCodes, ErrorDefinitions> = {
    CONTESTANT_CANDIDATE_NUMBER_REQUIRED: {
        code: "CONTESTANT_CANDIDATE_NUMBER_REQUIRED",
        message: "Candidate number is required.",
        status: 400,
    },
    CONTESTANT_CANDIDATE_NUMBER_INVALID: {
        code: "CONTESTANT_CANDIDATE_NUMBER_INVALID",
        message: "Candidate number must be a positive whole number.",
        status: 400,
    },
    CONTESTANT_CANDIDATE_NUMBER_DUPLICATE: {
        code: "CONTESTANT_CANDIDATE_NUMBER_DUPLICATE",
        message: "Candidate number is already in use.",
        status: 400,
    },
    CONTESTANT_NAME_REQUIRED: {
        code: "CONTESTANT_NAME_REQUIRED",
        message: "Contestant name is required.",
        status: 400,
    },
    CONTESTANT_GENDER_REQUIRED: {
        code: "CONTESTANT_GENDER_REQUIRED",
        message: "Gender is required.",
        status: 400,
    },
    CONTESTANT_GENDER_INVALID: {
        code: "CONTESTANT_GENDER_INVALID",
        message: "Gender must be Male or Female.",
        status: 400,
    },
    CONTESTANT_TEAM_NAME_REQUIRED: {
        code: "CONTESTANT_TEAM_NAME_REQUIRED",
        message: "Team name is required.",
        status: 400,
    },
    CONTESTANT_TEAM_COLOR_REQUIRED: {
        code: "CONTESTANT_TEAM_COLOR_REQUIRED",
        message: "Team color is required.",
        status: 400,
    },
    CONTESTANT_ADD_ERROR: {
        code: "CONTESTANT_ADD_ERROR",
        message: "Unable to add contestant.",
        status: 500,
    },
    CONTESTANT_GET_ALL_ERROR: {
        code: "CONTESTANT_GET_ALL_ERROR",
        message: "Unable to fetch contestants.",
        status: 500,
    },
    CONTESTANT_GET_BY_ID_ERROR: {
        code: "CONTESTANT_GET_BY_ID_ERROR",
        message: "Unable to get contestant by id.",
        status: 500,
    },
    CONTESTANT_FILTER_INVALID: {
        code: "CONTESTANT_FILTER_INVALID",
        message: "Filter must be Male or Female.",
        status: 400,
    },
    CONTESTANT_ID_REQUIRED: {
        code: "CONTESTANT_ID_REQUIRED",
        message: "Contestant ID is required.",
        status: 400,
    },
    CONTESTANT_ID_INVALID: {
        code: "CONTESTANT_ID_INVALID",
        message: "Contestant ID must be a positive whole number.",
        status: 400,
    },
    CONTESTANT_NOT_FOUND: {
        code: "CONTESTANT_NOT_FOUND",
        message: "Contestant not found.",
        status: 404,
    },
    CONTESTANT_LOCKED: {
        code: "CONTESTANT_LOCKED",
        message: "Contestant cannot be edited because it has scores already.",
        status: 400,
    },
    CONTESTANT_EDIT_ERROR: {
        code: "CONTESTANT_EDIT_ERROR",
        message: "Unable to edit contestant.",
        status: 500,
    },
    CONTESTANT_DELETE_ERROR: {
        code: "CONTESTANT_DELETE_ERROR",
        message: "Unable to delete contestant.",
        status: 500,
    },
}

export type ContestantErrorCodes = keyof typeof CONTESTANT_ERROR_CODES
