import type { Context, Next } from "hono"
import { AppError } from "../../errors/appError.js"
import { isNotEmpty } from "../../utils/validation.js"

import type { AddRoundRequestBody, EditRoundRequestBody } from "./types.js"

const isPositiveInteger = (value: unknown): boolean =>
    typeof value === "number" && Number.isInteger(value) && value > 0

export async function validateAddRoundInput(c: Context, next: Next) {
    const { name, phaseOrder, contestantLimit } = await c.req.json<AddRoundRequestBody>()

    if (!isNotEmpty(name)) throw new AppError("ROUND_NAME_INVALID", { field: "add_round_input_name" })
    if (!isPositiveInteger(phaseOrder)) throw new AppError("ROUND_PHASE_ORDER_INVALID", { field: "add_round_input_phase_order" })
    if (contestantLimit !== undefined && contestantLimit !== null && !isPositiveInteger(contestantLimit))
        throw new AppError("ROUND_CONTESTANT_LIMIT_INVALID", { field: "add_round_input_contestant_limit" })

    c.set("roundInput", {
        name: (name as string).trim(),
        phaseOrder,
        contestantLimit: contestantLimit as number | null | undefined,
    })
    await next()
}

export async function validateGetRoundByIdInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("ROUND_ID_INVALID", { field: "get_round_by_id_input_id" })

    c.set("getRoundByIdInput", { id: parsedId })
    await next()
}

export async function validateEditRoundInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const { name, contestantLimit } = await c.req.json<EditRoundRequestBody>()

    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("ROUND_ID_INVALID", { field: "edit_round_input_id" })
    if (!isNotEmpty(name)) throw new AppError("ROUND_NAME_INVALID", { field: "edit_round_input_name" })
    if (contestantLimit !== undefined && contestantLimit !== null && !isPositiveInteger(contestantLimit)) throw new AppError("ROUND_CONTESTANT_LIMIT_INVALID", { field: "edit_round_input_contestant_limit" })

    c.set("editRoundInput", {
        id: parsedId,
        name: (name as string).trim(),
        contestantLimit: contestantLimit as number | null | undefined,
    })

    await next()
}