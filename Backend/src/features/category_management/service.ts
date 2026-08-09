import { AppError } from "../../errors/appError.js"
import logger from "../../infra/logger.js"
import { prisma } from "../../infra/prisma.js"
import { createCategory } from "./data.js"
import type { AddCategoryInput } from "./types.js"

export async function addCategoryService({ name, roundId }: AddCategoryInput) {

    const roundExists = await prisma.round.findUnique({
        where: {
            id: roundId
        }
    })
    if (!roundExists) {
        logger.warn({ roundId }, "Round not found")
        throw new AppError("ROUND_PHASE_NOT_FOUND")
    }

    try {
        await createCategory({ name, roundId })
    } catch (err) {
        logger.error({ err }, "Error adding category")
        throw new AppError("CATEGORY_ADD_ERROR")
    }
}