import { AppError } from "../../errors/appError.js"
import logger from "../../infra/logger.js"
import { prisma } from "../../infra/prisma.js"
import { createCategory, editCategory } from "./data.js"
import type { AddCategoryInput, EditCategoryInput } from "./types.js"

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

export async function editCategoryService({ id, name }: EditCategoryInput) {

    const categoryExists = await prisma.category.findUnique({
        where: {
            id
        }
    })
    if (!categoryExists) {
        logger.warn({ id }, "Category not found")
        throw new AppError("CATEGORY_NOT_FOUND")
    }

    const hasScores = await prisma.score.count({ where: { categoryId: id } })
    if (hasScores > 0) {
        logger.warn({ id }, "Category is locked because scores exist")
        throw new AppError("CATEGORY_LOCKED")
    }

    try {
        await editCategory({ id, name })
    } catch (err) {
        logger.error({ err }, "Error editing category")
        throw new AppError("CATEGORY_EDIT_ERROR")
    }

}