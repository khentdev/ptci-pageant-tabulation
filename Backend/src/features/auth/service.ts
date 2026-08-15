import { AppError } from '../../errors/appError.js';
import * as argon2 from "argon2";
import logger from '../../infra/logger.js';
import { prisma } from '../../infra/prisma.js';

import type { LoginInput, Role } from "./types.js";
import { generateSessionTokens } from '../../lib/jwt/tokens.js';
import { hashData } from '../../lib/hash.js';

export async function loginService({ username, password, deviceId }: LoginInput) {
    const user = await prisma.user.findUnique({
        where: {
            username
        },
        select: {
            id: true,
            name: true,
            username: true,
            role: true,
            hashedPassword: true,
        }
    })
    if (!user) {
        logger.warn({ username }, "User not found")
        throw new AppError("INVALID_CREDENTIALS", { field: "username_password" })
    }

    const isPasswordMatched = await argon2.verify(user.hashedPassword, password)
    if (!isPasswordMatched) {
        logger.warn({ username }, "Invalid password")
        throw new AppError("INVALID_CREDENTIALS", { field: "username_password" })
    }

    const { sessionToken, csrfToken } = await generateSessionTokens({
        sub: user.id,
        role: user.role as Role,
        deviceHash: hashData(deviceId)
    })

    logger.info({ username }, "Generating session tokens for this user.")

    return {
        sessionToken,
        csrfToken,
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
        }
    }
}