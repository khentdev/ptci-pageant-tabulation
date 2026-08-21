import type { Context } from "hono";
import type { GetJudgeSubmissionsInputVariables, GetJudgeSubmissionsResponse } from "./types.js";
import { getJudgeSubmissionsService } from "./service.js";
import type { AppContext } from "../../types/context.js";

export async function getJudgeSubmissionsController(c: Context<AppContext<GetJudgeSubmissionsInputVariables>>) {
    const input = c.get("getJudgeSubmissions")
    const judgeSubmissions = await getJudgeSubmissionsService(input)
    return c.json<GetJudgeSubmissionsResponse>({
        data: judgeSubmissions,
        message: "Judge submissions fetched successfully"
    })
}
