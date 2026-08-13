import { AppError } from "../../errors/appError.js"
import logger from "../../infra/logger.js"
import { Prisma, prisma } from "../../infra/prisma.js"
import { addContestant, getAllContestants } from "./data.js"
import type { AddContestantInput, GetAllContestantsParams } from "./types.js"

export async function addContestantService({ candidateNumber, name, gender, teamName, teamColor }: AddContestantInput) {
    const existingContestant = await prisma.contestant.findUnique({
        where: { candidateNumber },
        select: { id: true },
    })

    if (existingContestant) {
        logger.warn({ candidateNumber }, "Duplicate candidate number on contestant create")
        throw new AppError("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE", { field: "add_contestant_input_candidate_number" })
    }

    try {
        await addContestant({ candidateNumber, name, gender, teamName, teamColor })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            logger.warn({ candidateNumber }, "Duplicate candidate number caught by database constraint")
            throw new AppError("CONTESTANT_CANDIDATE_NUMBER_DUPLICATE", { field: "add_contestant_input_candidate_number" })
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