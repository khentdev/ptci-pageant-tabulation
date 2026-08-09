import type { Context } from "hono";
import { addRoundService, editRoundService, getRoundByIdService, getRoundsListService } from './service.js';

import type { AppContext } from "../../types/context.js";
import type { AddRoundInputVariables, AddRoundResponse, EditRoundInputVariables, EditRoundResponse, GetRoundByIdInputVariables, GetRoundByIdResponse, GetRoundsListResponse } from "./types.js";

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
    }, 200)
}
export async function getRoundByIdController(c: Context<AppContext<GetRoundByIdInputVariables>>) {
    const { id } = c.var.getRoundByIdInput
    const round = await getRoundByIdService({ id })
    return c.json<GetRoundByIdResponse>({
        data: round,
        message: "Round retrieved successfully",
    }, 200)
}
export async function editRoundController(c: Context<AppContext<EditRoundInputVariables>>) {
    const { id, name, contestantLimit } = c.var.editRoundInput
    await editRoundService({ id, name, contestantLimit })
    return c.json<EditRoundResponse>({
        message: "Round edited successfully",
    }, 200)
}