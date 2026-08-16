import * as argon from 'argon2';

import { addJudge, getJudgeList } from './data.js';

import type { AddJudgeInput } from "./types.js";
import logger from '../../infra/logger.js';
import { AppError } from '../../errors/appError.js';
import { prisma } from '../../infra/prisma.js';

export async function addJudgeService({ name, username, password }: AddJudgeInput) {
    const usernameExists = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });

    if (usernameExists) {
        logger.warn({ username }, "Judge username already exists");
        throw new AppError("JUDGE_USERNAME_EXISTS");
    }

    try {
        const hashedPassword = await argon.hash(password);
        await addJudge({ name, username, password: hashedPassword });
    } catch (err) {
        logger.error({ err }, "Error adding judge");
        throw new AppError("JUDGE_ADD_FAILED");
    }
}

export async function getJudgeListService() {
    try {
        return await getJudgeList()
    } catch (err) {
        logger.error({ err }, "Error getting judge list");
        throw new AppError("JUDGE_GET_LIST_FAILED");
    }
}