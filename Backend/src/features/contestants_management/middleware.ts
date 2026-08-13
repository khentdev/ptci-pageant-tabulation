import type { Context, Next } from "hono"
import type { AddContestantRequestBody, Gender } from "./types.js"
import { AppError } from "../../errors/appError.js"
import { isNotEmpty } from "../../utils/validation.js"

export async function validateAddContestantInput(c: Context, next: Next) {
    const { candidateNumber, name, gender, teamName, teamColor } = await c.req.json<AddContestantRequestBody>()

    if (!isNotEmpty(candidateNumber)) throw new AppError("CONTESTANT_CANDIDATE_NUMBER_REQUIRED", { field: "add_contestant_input_candidate_number" })
    if (!isNotEmpty(name)) throw new AppError("CONTESTANT_NAME_REQUIRED", { field: "add_contestant_input_name" })
    if (!isNotEmpty(gender)) throw new AppError("CONTESTANT_GENDER_REQUIRED", { field: "add_contestant_input_gender" })
    if (!isNotEmpty(teamName)) throw new AppError("CONTESTANT_TEAM_NAME_REQUIRED", { field: "add_contestant_input_team_name" })
    if (!isNotEmpty(teamColor)) throw new AppError("CONTESTANT_TEAM_COLOR_REQUIRED", { field: "add_contestant_input_team_color" })

    const parsedCandidateNumber = Number(candidateNumber)
    if (!Number.isInteger(parsedCandidateNumber) || parsedCandidateNumber <= 0) throw new AppError("CONTESTANT_CANDIDATE_NUMBER_INVALID", { field: "add_contestant_input_candidate_number" })

    const normalizedGender = (gender as string).trim().toUpperCase()
    if (normalizedGender !== "MALE" && normalizedGender !== "FEMALE") throw new AppError("CONTESTANT_GENDER_INVALID", { field: "add_contestant_input_gender" })


    c.set("addContestantInput", {
        candidateNumber: parsedCandidateNumber,
        name: (name as string).trim(),
        gender: normalizedGender as Gender,
        teamName: (teamName as string).trim(),
        teamColor: (teamColor as string).trim(),
    })
    await next()
}

export async function validateGetAllContestantsParams(c: Context, next: Next) {
    const rawFilter = c.req.query("filter")
    const normalized = rawFilter?.trim().toUpperCase() || undefined

    if (normalized !== undefined && normalized !== "MALE" && normalized !== "FEMALE") {
        throw new AppError("CONTESTANT_FILTER_INVALID", { field: "get_all_contestants_params_filter" })
    }

    c.set("getAllContestantsParams", normalized ? { filter: normalized as Gender } : {})
    await next()
}