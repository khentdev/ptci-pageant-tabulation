import type { Context, Next } from "hono";
import type { AppContext } from "../types/context.js";
import { Role } from "../../generated/prisma/enums.js";
import { AppError } from "../errors/appError.js";
import logger from "../infra/logger.js";

export function requireRole(...roles: Role[]) {
    return async (c: Context<AppContext>, next: Next) => {
        const payload = c.var.authenticatedUserTokenPayload
        if (!roles.includes(payload.role)) {
            logger.warn({
                role: payload.role,
                userId: payload.sub
            }, "Unauthorized access attempt")
            throw new AppError("FORBIDDEN")
        }
        await next()
    }
}
