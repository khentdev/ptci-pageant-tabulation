import type { Context, Next } from "hono";
import { AppError } from "../../errors/appError.js";

export async function validateGetJudgeSubmissions(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("ROUND_ID_INVALID", { field: "get_judge_submissions_input_id" })

    c.set("getJudgeSubmissions", { id: parsedId })
    await next()
}
