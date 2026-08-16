import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type {
    AddJudgeInputVariables,
    DeleteJudgeInputVariables,
    EditJudgeInputVariables,
    GetJudgeListResponse,
    ResetJudgePasswordInputVariables,
} from "./types.js";
import {
    addJudgeService,
    deleteJudgeService,
    editJudgeService,
    getJudgeListService,
    resetJudgePasswordService,
} from "./service.js";

export async function addJudgeController(c: Context<AppContext<AddJudgeInputVariables>>) {
    const input = c.var.addJudgeInput;
    await addJudgeService(input)
    return c.json({ message: "Judge added successfully." }, 201)
}

export async function getJudgeListController(c: Context) {
    const judges = await getJudgeListService()
    return c.json<GetJudgeListResponse>({ data: judges, message: "Judge list fetched successfully." }, 200)
}

export async function editJudgeController(c: Context<AppContext<EditJudgeInputVariables>>) {
    const input = c.var.editJudgeInput
    await editJudgeService(input)
    return c.json({ message: "Judge updated successfully." }, 200)
}

export async function resetJudgePasswordController(c: Context<AppContext<ResetJudgePasswordInputVariables>>) {
    const input = c.var.resetJudgePasswordInput
    await resetJudgePasswordService(input)
    return c.json({ message: "Judge password reset successfully." }, 200)
}

export async function deleteJudgeController(c: Context<AppContext<DeleteJudgeInputVariables>>) {
    const input = c.var.deleteJudgeInput
    await deleteJudgeService(input)
    return c.json({ message: "Judge deleted successfully." }, 200)
}
