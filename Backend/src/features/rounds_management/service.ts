import { AppError } from '../../errors/appError.js';
import logger from '../../infra/logger.js';
import { Prisma, prisma } from '../../infra/prisma.js';
import { addRound, editRound, getRoundById, getRoundsList } from './data.js';

import type { AddRoundInput, EditRoundInput, GetRoundByIdInput } from "./types.js";

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

export async function getRoundByIdService({ id }: GetRoundByIdInput) {
    try {
        const round = await getRoundById(id)
        if (!round) throw new AppError("ROUND_PHASE_NOT_FOUND")
        return round
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, id }, "Error getting round by id")
        throw new AppError("ROUND_PHASE_GET_BY_ID_ERROR")
    }
}

export async function editRoundService({ id, name, contestantLimit }: EditRoundInput) {
    const existingRound = await prisma.round.findUnique({ where: { id }, select: { id: true, contestantLimit: true, name: true, phaseOrder: true } })
    if (!existingRound) throw new AppError("ROUND_PHASE_NOT_FOUND")

    const hasContestants = await prisma.roundContestant.count({ where: { roundId: id } })
    if (hasContestants && contestantLimit !== existingRound.contestantLimit)
        throw new AppError("ROUND_CONTESTANT_LIMIT_LOCKED")

    if (existingRound.phaseOrder === 1 && contestantLimit != null)
        throw new AppError("ROUND_PRELIMINARY_LIMIT_LOCKED")

    try {
        await editRound({
            id,
            name,
            contestantLimit
        })
    } catch (err) {
        logger.error({ err }, "Error editing round")
        throw new AppError("ROUND_PHASE_EDIT_ERROR")
    }
}