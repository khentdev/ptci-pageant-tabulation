import type { Context } from "hono";
import type { AdvanceRoundInputVariables, AdvanceRoundResponse, DeclareWinnersInputVariables, DeclareWinnersResponse, GetDeclaredWinnersInputVariables, GetDeclaredWinnersResponse, GetJudgeSubmissionsInputVariables, GetJudgeSubmissionsResponse, GetRoundResultsInputVariables, GetRoundResultsResponse } from "./types.js";
import { advanceRoundService, declareWinnersService, getDeclaredWinnersService, getJudgeSubmissionsService, getRoundResultsByIdService } from "./service.js";
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

export async function advanceRoundController(c: Context<AppContext<AdvanceRoundInputVariables>>) {
    const input = c.get("advanceRound")
    await advanceRoundService(input)
    return c.json<AdvanceRoundResponse>({
        message: "Round advanced successfully"
    }, 201)
}

export async function declareWinnersController(c: Context<AppContext<DeclareWinnersInputVariables>>) {
    const input = c.get("declareWinners")
    await declareWinnersService(input)
    return c.json<DeclareWinnersResponse>({
        message: "Winners declared successfully"
    }, 201)
}

export async function getDeclaredWinnersController(c: Context<AppContext<GetDeclaredWinnersInputVariables>>) {
    const input = c.get("getDeclaredWinners")
    const declaredWinners = await getDeclaredWinnersService(input)
    return c.json<GetDeclaredWinnersResponse>({
        data: declaredWinners,
        message: "Declared winners fetched successfully"
    }, 200)
}