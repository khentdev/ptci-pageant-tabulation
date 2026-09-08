import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type {
    GetCategoryScoringFieldsInputVariables,
    GetCategoryScoringFieldsResponse,
    GetJudgeRoundsResponse,
    GetMyCategoryScoresInputVariables,
    GetMyCategoryScoresResponse,
    GetRoundContestantsInputVariables,
    GetRoundContestantsResponse,
    SubmitCategoryScoresInputVariables,
    SubmitCategoryScoresResponse,
} from "./types.js";
import {
    getCategoryScoringFieldsService,
    getJudgeRoundsService,
    getMyCategoryScoresService,
    getRoundContestantsService,
    submitCategoryScoresService,
} from "./service.js";

export async function getJudgeRoundsController(c: Context) {
    const rounds = await getJudgeRoundsService()
    return c.json<GetJudgeRoundsResponse>({
        data: rounds,
        message: "Rounds fetched successfully."
    }, 200)
}

export async function getRoundContestantsController(c: Context<AppContext<GetRoundContestantsInputVariables>>) {
    const input = c.var.getRoundContestantsInput
    const contestants = await getRoundContestantsService(input)
    return c.json<GetRoundContestantsResponse>({
        data: contestants,
        message: "Contestants fetched successfully."
    }, 200)
}

export async function getCategoryScoringFieldsController(c: Context<AppContext<GetCategoryScoringFieldsInputVariables>>) {
    const input = c.var.getCategoryScoringFieldsInput
    const fields = await getCategoryScoringFieldsService(input)
    return c.json<GetCategoryScoringFieldsResponse>({
        data: fields,
        message: "Scoring fields fetched successfully."
    }, 200)
}

export async function getMyCategoryScoresController(c: Context<AppContext<GetMyCategoryScoresInputVariables>>) {
    const input = c.var.getMyCategoryScoresInput
    const scores = await getMyCategoryScoresService(input)
    return c.json<GetMyCategoryScoresResponse>({
        data: scores,
        message: "Scores fetched successfully."
    }, 200)
}

export async function submitCategoryScoresController(c: Context<AppContext<SubmitCategoryScoresInputVariables>>) {
    const input = c.var.submitCategoryScoresInput
    await submitCategoryScoresService(input)
    return c.json<SubmitCategoryScoresResponse>({
        message: "Scores submitted successfully."
    }, 201)
}
