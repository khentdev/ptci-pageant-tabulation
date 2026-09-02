import type { Context, Next } from "hono";
import type {
    AddJudgeInputRequestBody,
    EditJudgeRequestBody,
    ResetJudgePasswordRequestBody,
} from "./types.js";
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

export async function validateEditJudgeInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const { name, username } = await c.req.json<EditJudgeRequestBody>()

    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("JUDGE_ID_INVALID", { field: "edit_judge_input_id" })

    if (!isMinLength(name, 3)) throw new AppError("JUDGE_NAME_TOO_SHORT", { field: "judge_name_input" })
    if (!isMinLength(username, 3)) throw new AppError("JUDGE_USERNAME_TOO_SHORT", { field: "judge_username_input" })

    c.set("editJudgeInput", {
        id: parsedId,
        name: (name as string).trim(),
        username: (username as string).trim(),
    })
    await next()
}

export async function validateResetJudgePasswordInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const { password } = await c.req.json<ResetJudgePasswordRequestBody>()

    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("JUDGE_ID_INVALID", { field: "reset_judge_password_input_id" })

    if (!isMinLength(password, 8)) throw new AppError("JUDGE_PASSWORD_TOO_SHORT", { field: "judge_password_input" })

    c.set("resetJudgePasswordInput", {
        id: parsedId,
        password: password as string,
    })
    await next()
}

export async function validateDeleteJudgeInput(c: Context, next: Next) {
    const id = c.req.param("id")
    const parsedId = Number(id)
    if (!Number.isInteger(parsedId) || parsedId <= 0) throw new AppError("JUDGE_ID_INVALID", { field: "delete_judge_input" })

    c.set("deleteJudgeInput", { id: parsedId })
    await next()
}
