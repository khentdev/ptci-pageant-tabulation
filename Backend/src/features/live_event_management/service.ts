import { AppError } from "../../errors/appError.js";
import logger from "../../infra/logger.js";
import { prisma } from "../../infra/prisma.js";
import { getJudgeSubmissions } from "./data.js";
import type { GetJudgeSubmissions } from "./types.js";

export async function getJudgeSubmissionsService({ id }: GetJudgeSubmissions) {
    const roundExists = await prisma.round.findUnique({
        where: {
            id
        }
    })
    if (!roundExists) {
        logger.warn({ id }, "Round not found")
        throw new AppError("ROUND_PHASE_NOT_FOUND")
    }

    try {
        return await getJudgeSubmissions({ id })
    } catch (err) {
        logger.error({ err }, "Error getting judge submissions")
        throw new AppError("JUDGE_SUBMISSIONS_GET_ERROR")
    }
}
