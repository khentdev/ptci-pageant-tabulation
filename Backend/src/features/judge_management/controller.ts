import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { AddJudgeInputVariables, GetJudgeListResponse } from "./types.js";
import { addJudgeService, getJudgeListService } from "./service.js";

export async function addJudgeController(c: Context<AppContext<AddJudgeInputVariables>>) {
    const input = c.var.addJudgeInput;
    await addJudgeService(input)
    return c.json({ message: "Judge added successfully." }, 201)
}

export async function getJudgeListController(c: Context) {
    const judges = await getJudgeListService()
    return c.json<GetJudgeListResponse>({ data: judges, message: "Judge list fetched successfully." }, 200)
}