import { AppError } from "../../errors/appError.js";
import logger from "../../infra/logger.js";
import { prisma } from "../../infra/prisma.js";
import { getJudgeSubmissions, getRoundResultsById } from "./data.js";
import type { GetJudgeSubmissions, GetRoundResultsById } from "./types.js";

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

export async function getRoundResultsByIdService({ id }: Omit<GetRoundResultsById, "phaseOrder">) {
    const round = await prisma.round.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            phaseOrder: true
        }
    })
    if (!round) {
        logger.warn({ id }, "Round not found")
        throw new AppError("ROUND_PHASE_NOT_FOUND")
    }

    try {
        return await getRoundResultsById({ id, phaseOrder: round.phaseOrder })
    } catch (err) {
        logger.error({ err }, "Error getting round results")
        throw new AppError("ROUND_RESULTS_GET_ERROR")
    }
}
