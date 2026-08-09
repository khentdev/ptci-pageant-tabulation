import type { Context } from "hono";
import { addRoundService } from "./service.js";
import type { AppContext } from "../../types/context.js";
import type { AddRoundInputVariables, AddRoundResponse } from "./types.js";

export async function addRoundController(c: Context<AppContext<AddRoundInputVariables>>) {
    const { name, phaseOrder, contestantLimit } = c.var.roundInput
    await addRoundService({ name, phaseOrder, contestantLimit })
    return c.json<AddRoundResponse>({
        message: "Round added successfully",
    }, 201)
}