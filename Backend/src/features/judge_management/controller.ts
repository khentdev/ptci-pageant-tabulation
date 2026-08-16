import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { AddJudgeInputVariables } from "./types.js";
import { addJudgeService } from "./service.js";

export async function addJudgeController(c: Context<AppContext<AddJudgeInputVariables>>) {
    const input = c.var.addJudgeInput;
    await addJudgeService(input)
    return c.json({ message: "Judge added successfully." }, 201)
}