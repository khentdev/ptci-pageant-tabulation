import type { Context } from "hono"
import type { AppContext } from "../../types/context.js"
import { addContestantService, getAllContestantsService } from "./service.js"
import type { AddContestantInputVariables, GetAllContestantsParamsVariables, GetAllContestantsResponse } from "./types.js"

export async function addContestantController(c: Context<AppContext<AddContestantInputVariables>>) {
    const input = c.var.addContestantInput
    await addContestantService(input)
    return c.json({ message: "Contestant added successfully" }, 201)
}

export async function getAllContestantsController(c: Context<AppContext<GetAllContestantsParamsVariables>>) {
    const params = c.var.getAllContestantsParams
    const contestants = await getAllContestantsService(params)
    return c.json<GetAllContestantsResponse>({ data: contestants, message: "Contestants fetched successfully" }, 200)
}