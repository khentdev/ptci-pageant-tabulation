import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { AddCategoryInputVariables, AddCategoryResponse, EditCategoryInputVariables, EditCategoryResponse } from "./types.js";
import { addCategoryService, editCategoryService } from './service.js';

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