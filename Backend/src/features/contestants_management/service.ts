import { AppError } from "../../errors/appError.js"
import logger from "../../infra/logger.js"
import { Prisma, prisma } from "../../infra/prisma.js"
import { addContestant, deleteContestant, editContestant, getAllContestants, getContestantById } from "./data.js"
import type { AddContestantInput, DeleteContestantInput, EditContestantInput, GetAllContestantsParams, GetContestantByIdInput } from "./types.js"

export async function addContestantService({ candidateNumber, name, gender, teamName, teamColor }: AddContestantInput) {
    const existingContestant = await prisma.contestant.findUnique({
        where: { candidateNumber },
        select: { id: true },
    })

    if (existingContestant) {
        logger.warn({ candidateNumber }, "Duplicate candidate number on contestant create")
        throw new AppError("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE")
    }

    try {
        await addContestant({ candidateNumber, name, gender, teamName, teamColor })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            logger.warn({ candidateNumber }, "Duplicate candidate number caught by database constraint")
            throw new AppError("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE")
        }
        logger.error({ err }, "Error adding contestant")
        throw new AppError("CONTESTANT_ADD_ERROR")
    }
}

export async function getAllContestantsService({ filter }: GetAllContestantsParams) {
    try {
        return await getAllContestants({ filter })
    } catch (err) {
        logger.error({ err }, "Error fetching contestants")
        throw new AppError("CONTESTANT_GET_ALL_ERROR")
    }
}

export async function getContestantByIdService({ id }: GetContestantByIdInput) {
    try {
        const contestant = await getContestantById({ id })
        if (!contestant) throw new AppError("CONTESTANT_NOT_FOUND")
        return contestant
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, id }, "Error getting contestant by id")
        throw new AppError("CONTESTANT_GET_BY_ID_ERROR")
    }
}

export async function editContestantService({ id, candidateNumber, name, gender, teamName, teamColor }: EditContestantInput) {

    const existingContestant = await prisma.contestant.findUnique({
        where: { id },
        select: { id: true },
    })
    if (!existingContestant) {
        logger.warn({ id }, "Contestant not found on contestant edit")
        throw new AppError("CONTESTANT_NOT_FOUND")
    }

    const duplicateCount = await prisma.contestant.count({
        where: { candidateNumber, NOT: { id } },
    })
    if (duplicateCount > 0) {
        logger.warn({ id, candidateNumber }, "Duplicate candidate number on contestant edit")
        throw new AppError("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE")
    }

    const contestantHasScores = await prisma.score.count({ where: { contestantId: id } })
    if (contestantHasScores > 0) {
        logger.warn({ id }, "Contestant is locked because scores exist")
        throw new AppError("CONTESTANT_LOCKED")
    }

    try {
        await editContestant({ id, candidateNumber, name, gender, teamName, teamColor })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            logger.warn({ id, candidateNumber }, "Duplicate candidate number caught by database constraint on edit")
            throw new AppError("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE")
        }
        logger.error({ err }, "Error editing contestant")
        throw new AppError("CONTESTANT_EDIT_ERROR")
    }
}

export async function deleteContestantService({ id }: DeleteContestantInput) {
    const contestant = await prisma.contestant.findUnique({
        where: { id },
        select: { id: true },
    })
    if (!contestant) {
        logger.warn({ id }, "Contestant not found on contestant delete")
        throw new AppError("CONTESTANT_NOT_FOUND")
    }

    const contestantHasScores = await prisma.score.count({ where: { contestantId: id } })
    if (contestantHasScores > 0) {
        logger.warn({ id }, "Contestant is locked because scores exist")
        throw new AppError("CONTESTANT_LOCKED")
    }

    try {
        await deleteContestant({ id })
    } catch (err) {
        logger.error({ err }, "Error deleting contestant")
        throw new AppError("CONTESTANT_DELETE_ERROR")
    }
}