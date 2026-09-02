import * as argon from 'argon2';

import { addJudge, deleteJudge, editJudge, getJudgeList, resetJudgePassword } from './data.js';

import type { AddJudgeInput, DeleteJudgeInput, EditJudgeInput, ResetJudgePasswordInput } from "./types.js";
import logger from '../../infra/logger.js';
import { AppError } from '../../errors/appError.js';
import { prisma } from '../../infra/prisma.js';
import { Role } from '../../../generated/prisma/enums.js';

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

export async function editJudgeService({ id, name, username }: EditJudgeInput) {
    const existingJudge = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
    })

    if (!existingJudge || existingJudge.role !== Role.JUDGE) {
        logger.warn({ id }, "Judge not found on judge edit")
        throw new AppError("JUDGE_NOT_FOUND")
    }

    const duplicateCount = await prisma.user.count({
        where: { username, NOT: { id } },
    })

    if (duplicateCount > 0) {
        logger.warn({ id, username }, "Duplicate username on judge edit")
        throw new AppError("JUDGE_USERNAME_EXISTS")
    }

    try {
        await editJudge({ id, name, username })
    } catch (err) {
        logger.error({ err }, "Error editing judge")
        throw new AppError("JUDGE_EDIT_FAILED")
    }
}

export async function resetJudgePasswordService({ id, password }: ResetJudgePasswordInput) {
    const existingJudge = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
    })

    if (!existingJudge || existingJudge.role !== Role.JUDGE) {
        logger.warn({ id }, "Judge not found on judge password reset")
        throw new AppError("JUDGE_NOT_FOUND")
    }

    try {
        const hashedPassword = await argon.hash(password)
        await resetJudgePassword({ id, password: hashedPassword })
    } catch (err) {
        logger.error({ err }, "Error resetting judge password")
        throw new AppError("JUDGE_RESET_PASSWORD_FAILED")
    }
}

export async function deleteJudgeService({ id }: DeleteJudgeInput) {
    const existingJudge = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
    })

    if (!existingJudge || existingJudge.role !== Role.JUDGE) {
        logger.warn({ id }, "Judge not found on judge delete")
        throw new AppError("JUDGE_NOT_FOUND")
    }

    const judgeHasScores = await prisma.score.count({ where: { judgeId: id } })
    if (judgeHasScores > 0) {
        logger.warn({ id }, "Judge is locked because scores exist")
        throw new AppError("JUDGE_LOCKED")
    }

    try {
        await deleteJudge({ id })
    } catch (err) {
        logger.error({ err }, "Error deleting judge")
        throw new AppError("JUDGE_DELETE_FAILED")
    }
}
