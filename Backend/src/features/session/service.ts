import { AppError } from '../../errors/appError.js';
import logger from '../../infra/logger.js';
import { prisma } from '../../infra/prisma.js';
import { generateSessionTokens } from '../../lib/jwt/tokens.js';

import type { TokenPayload } from "../../lib/jwt/index.js";
export async function getSessionService(payload: TokenPayload) {
    logger.info({ userId: payload.sub }, "Session retrieval started.")

    const nowSeconds = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - nowSeconds
    const oneHour = 60 * 60

    let tokens: Awaited<ReturnType<typeof generateSessionTokens>> | null = null;
    if (expiresIn < oneHour) {
        logger.info({ userId: payload.sub, expiresIn }, "Token nearing expiry. Starting rotation.")

        try {
            tokens = await generateSessionTokens({
                sub: payload.sub,
                role: payload.role,
                deviceHash: payload.deviceHash
            })
            logger.info({ userId: payload.sub }, "JWT rotated successfully.")
        } finally {
        }
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.sub }, select: {
            id: true,
            name: true,
            username: true,
            role: true
        }
    })
    if (!user) throw new AppError("SESSION_UNAUTHORIZED", { field: "session_user" })

    return {
        user,
        tokens
    }
}