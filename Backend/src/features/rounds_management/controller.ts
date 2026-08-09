import type { Context } from "hono";
import { addRoundService, getRoundsListService } from './service.js';

import type { AppContext } from "../../types/context.js";
import type { AddRoundInputVariables, AddRoundResponse, GetRoundsListResponse } from "./types.js";

export async function addRoundController(c: Context<AppContext<AddRoundInputVariables>>) {
    const { name, phaseOrder, contestantLimit } = c.var.roundInput
    await addRoundService({ name, phaseOrder, contestantLimit })
    return c.json<AddRoundResponse>({
        message: "Round added successfully",
    }, 201)
}
export async function getRoundsListController(c: Context) {
    const roundsList = await getRoundsListService()
    return c.json<GetRoundsListResponse>({
        data: roundsList,
        message: "Rounds list retrieved successfully",
    })
}