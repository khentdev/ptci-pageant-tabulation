import type { Context, Next } from "hono";
import type { AddCategoryRequestBody, EditCategoryRequestBody } from "./types.js";
import { AppError } from '../../errors/appError.js';
import { isNotEmpty } from '../../utils/validation.js';

export async function validateAddCategoryInput(c: Context, next: Next) {
    const { name, roundId } = await c.req.json<AddCategoryRequestBody>()

    if (!isNotEmpty(name)) throw new AppError("CATEGORY_NAME_REQUIRED", { field: "add_category_input_name" })
    if (!isNotEmpty(roundId)) throw new AppError("CATEGORY_ROUND_ID_REQUIRED", { field: "add_category_input_round_id" })
    const parsedRoundId = Number(roundId)
    if (!Number.isInteger(parsedRoundId) || parsedRoundId <= 0) throw new AppError("CATEGORY_ROUND_ID_INVALID", { field: "add_category_input_round_id" })

    c.set("addCategoryInput", { name: (name as string).trim(), roundId: parsedRoundId })
    await next()
}

export async function validateEditCategoryInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const { name } = await c.req.json<EditCategoryRequestBody>()

    if (!isNotEmpty(name)) throw new AppError("CATEGORY_NAME_REQUIRED", { field: "edit_category_input_name" })
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("CATEGORY_ID_INVALID", { field: "edit_category_input_id" })

    c.set("editCategoryInput", { id: parsedId, name: (name as string).trim() })
    await next()
}