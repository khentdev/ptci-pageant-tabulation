import type { Context, Next } from "hono"
import { AppError } from "../../errors/appError.js"
import { isNotEmpty } from "../../utils/validation.js"

import type { AddRoundRequestBody } from "./types.js"

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
