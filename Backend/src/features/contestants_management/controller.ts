import type { Context } from "hono"
import type { AppContext } from "../../types/context.js"
import { addContestantService, deleteContestantService, editContestantService, getAllContestantsService, getContestantByIdService } from "./service.js"
import type { AddContestantInputVariables, DeleteContestantInputVariables, EditContestantInputVariables, GetAllContestantsParamsVariables, GetAllContestantsResponse, GetContestantByIdInputVariables, GetContestantByIdResponse } from "./types.js"

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

export async function getContestantByIdController(c: Context<AppContext<GetContestantByIdInputVariables>>) {
    const { id } = c.var.getContestantByIdInput
    const contestant = await getContestantByIdService({ id })
    return c.json<GetContestantByIdResponse>({
        data: contestant,
        message: "Contestant retrieved successfully",
    }, 200)
}

export async function editContestantController(c: Context<AppContext<EditContestantInputVariables>>) {
    const input = c.var.editContestantInput
    await editContestantService(input)
    return c.json({ message: "Contestant updated successfully" }, 200)
}


export async function deleteContestantController(c: Context<AppContext<DeleteContestantInputVariables>>) {
    const input = c.var.deleteContestantInput
    await deleteContestantService(input)
    return c.json({ message: "Contestant deleted successfully" }, 200)
}