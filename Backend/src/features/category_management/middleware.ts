import type { Context, Next } from "hono";
import type { AddCategoryRequestBody } from "./types.js";
import { AppError } from "../../errors/appError.js";
import { isNotEmpty } from "../../utils/validation.js";

export async function validateAddCategoryInput(c: Context, next: Next) {
    const { name, roundId } = await c.req.json<AddCategoryRequestBody>()

    if (!isNotEmpty(name)) throw new AppError("CATEGORY_NAME_INVALID", { field: "add_category_input_name" })
    if (!isNotEmpty(roundId)) throw new AppError("CATEGORY_ROUND_ID_INVALID", { field: "add_category_input_round_id" })
    const parsedRoundId = Number(roundId)
    if (!Number.isInteger(parsedRoundId) || parsedRoundId <= 0) throw new AppError("CATEGORY_ROUND_ID_INVALID", { field: "add_category_input_round_id" })

    c.set("addCategoryInput", { name: (name as string).trim(), roundId: parsedRoundId })
    await next()
}