import type { Context } from "hono";
import type { GetJudgeSubmissionsInputVariables, GetJudgeSubmissionsResponse, GetRoundResultsInputVariables, GetRoundResultsResponse } from "./types.js";
import { getJudgeSubmissionsService, getRoundResultsByIdService } from "./service.js";
import type { AppContext } from "../../types/context.js";

export async function getJudgeSubmissionsController(c: Context<AppContext<GetJudgeSubmissionsInputVariables>>) {
    const input = c.get("getJudgeSubmissions")
    const judgeSubmissions = await getJudgeSubmissionsService(input)
    return c.json<GetJudgeSubmissionsResponse>({
        data: judgeSubmissions,
        message: "Judge submissions fetched successfully"
    }, 200)
}

export async function getRoundResultsByIdController(c: Context<AppContext<GetRoundResultsInputVariables>>) {
    const input = c.get("getRoundResults")
    const roundResults = await getRoundResultsByIdService(input)
    return c.json<GetRoundResultsResponse>({
        data: roundResults,
        message: "Round results fetched successfully"
    }, 200)
}