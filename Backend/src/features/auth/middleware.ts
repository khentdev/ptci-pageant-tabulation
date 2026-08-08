import type { Context, Next } from "hono";
import type { LoginInputRequestBody } from "./types.js";
import { AppError } from '../../errors/appError.js';
import { isNotEmpty, isValidDeviceFingerprint } from '../../utils/validation.js';

export async function validateLoginInput(c: Context, next: Next) {
    const { username, password } = await c.req.json<LoginInputRequestBody>()
    const deviceId = c.req.header("X-Fingerprint")

    if (!isNotEmpty(username)) throw new AppError("INVALID_USERNAME")
    if (!isNotEmpty(password)) throw new AppError("INVALID_PASSWORD")
    if (!isValidDeviceFingerprint(deviceId)) throw new AppError("INVALID_DEVICE_ID")

    c.set("LoginInput", { username, password, deviceId })
    await next()
}