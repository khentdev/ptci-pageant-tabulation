import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { AddCategoryInputVariables, AddCategoryResponse } from "./types.js";
import { addCategoryService } from './service.js';

export async function addCategoryController(c: Context<AppContext<AddCategoryInputVariables>>) {
    const { name, roundId } = c.var.addCategoryInput

    await addCategoryService({ name, roundId })
    return c.json<AddCategoryResponse>({
        message: "Category added successfully",
    }, 201)
}