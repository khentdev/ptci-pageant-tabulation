import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { AddCategoryInputVariables, AddCategoryResponse, EditCategoryInputVariables, EditCategoryResponse, GetCategoryByIdInputVariables, GetCategoryByIdResponse, GetCategoryFieldsInputVariables, GetCategoryFieldsResponse, GetCategoryListResponse, SaveCategoryFieldsInputVariables, SaveCategoryFieldsResponse } from "./types.js";
import { addCategoryService, editCategoryService, getCategoryByIdService, getCategoryFieldsService, getCategoryListService, saveCategoryFieldsService } from './service.js';

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

export async function getCategoryListController(c: Context) {
    const categoryList = await getCategoryListService()
    return c.json<GetCategoryListResponse>({
        data: categoryList,
        message: "Category list retrieved successfully",
    }, 200)
}

export async function getCategoryFieldsController(c: Context<AppContext<GetCategoryFieldsInputVariables>>) {
    const { categoryId } = c.var.getCategoryFieldsInput

    const categoryFields = await getCategoryFieldsService({ categoryId })
    return c.json<GetCategoryFieldsResponse>({
        data: categoryFields,
        message: "Category fields retrieved successfully",
    }, 200)
}

export async function saveCategoryFieldsController(c: Context<AppContext<SaveCategoryFieldsInputVariables>>) {
    const { categoryId, fields } = c.var.saveCategoryFieldsInput

    await saveCategoryFieldsService({ categoryId, fields })
    return c.json<SaveCategoryFieldsResponse>({
        message: "Category fields saved successfully",
    }, 200)
}