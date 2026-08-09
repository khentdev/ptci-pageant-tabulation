import { AppError } from '../../errors/appError.js';
import logger from '../../infra/logger.js';
import { Prisma, prisma } from '../../infra/prisma.js';
import { addRound, getRoundsList } from './data.js';

import type { AddRoundInput } from "./types.js";

export async function addRoundService({ name, phaseOrder, contestantLimit }: AddRoundInput) {
    if (phaseOrder > 1) {
        const preliminaryRound = await prisma.round.findUnique({
            where: { phaseOrder: 1 },
            select: { id: true },
        })

        if (!preliminaryRound) {
            logger.warn({ phaseOrder }, "No preliminary round exists and phase order > 1")
            throw new AppError("ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS")
        }

        if (contestantLimit == null) {
            logger.warn({ phaseOrder }, "Contestant limit missing for round after preliminary")
            throw new AppError("ROUND_CONTESTANT_LIMIT_REQUIRED")
        }
    }

    const existingRoundWithPhaseOrder = await prisma.round.findUnique({
        where: { phaseOrder },
        select: { id: true },
    })

    if (existingRoundWithPhaseOrder) {
        logger.warn({ phaseOrder }, "Duplicate phase order on round create")
        throw new AppError(
            phaseOrder === 1 ? "ROUND_PHASE_ORDER_ALREADY_EXISTS" : "ROUND_PHASE_ORDER_DUPLICATE",
        )
    }

    const resolvedContestantLimit = phaseOrder === 1 ? null : contestantLimit
    try {
        await addRound({
            name,
            phaseOrder,
            contestantLimit: resolvedContestantLimit,
        })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            logger.warn({ phaseOrder }, "Duplicate phase order caught by database constraint")
            throw new AppError(
                phaseOrder === 1 ? "ROUND_PHASE_ORDER_ALREADY_EXISTS" : "ROUND_PHASE_ORDER_DUPLICATE",
            )
        }
        logger.error({ err }, "Error adding round")
        throw new AppError("ROUND_PHASE_ADD_ERROR")
    }
}

export async function getRoundsListService() {
    try {
        return await getRoundsList()
    } catch (err) {
        logger.error({ err }, "Error getting rounds list")
        throw new AppError("ROUND_PHASE_GET_LIST_ERROR")
    }
}