import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { AddCategoryInputVariables, AddCategoryResponse, EditCategoryInputVariables, EditCategoryResponse, GetCategoryByIdInputVariables, GetCategoryByIdResponse } from "./types.js";
import { addCategoryService, editCategoryService, getCategoryByIdService } from './service.js';

export async function addCategoryController(c: Context<AppContext<AddCategoryInputVariables>>) {
    const { name, roundId } = c.var.addCategoryInput

    await addCategoryService({ name, roundId })
    return c.json<AddCategoryResponse>({
        message: "Category added successfully",
    }, 201)
}

export async function editCategoryController(c: Context<AppContext<EditCategoryInputVariables>>) {
    const { id, name } = c.var.editCategoryInput

    await editCategoryService({ id, name })
    return c.json<EditCategoryResponse>({
        message: "Category updated successfully",
    }, 200)
}

export async function getCategoryByIdController(c: Context<AppContext<GetCategoryByIdInputVariables>>) {
    const { id } = c.var.getCategoryByIdInput

    const category = await getCategoryByIdService({ id })
    return c.json<GetCategoryByIdResponse>({
        data: category,
        message: "Category retrieved successfully",
    }, 200)
}