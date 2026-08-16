import type { Context, Next } from "hono";
import type { AddJudgeInputRequestBody } from "./types.js";
import { isMinLength } from "../../utils/validation.js";
import { AppError } from "../../errors/appError.js";

export async function validateAddJudgeInput(c: Context, next: Next) {
    const { name, username, password } = await c.req.json<AddJudgeInputRequestBody>()

    if (!isMinLength(name, 3)) throw new AppError("JUDGE_NAME_TOO_SHORT", { field: "judge_name_input" })
    if (!isMinLength(username, 3)) throw new AppError("JUDGE_USERNAME_TOO_SHORT", { field: "judge_username_input" })
    if (!isMinLength(password, 8)) throw new AppError("JUDGE_PASSWORD_TOO_SHORT", { field: "judge_password_input" })

    c.set("addJudgeInput", { name: (name as string).trim(), username: (username as string).trim(), password: password })
    await next()
}