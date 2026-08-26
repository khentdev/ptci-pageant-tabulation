import { AppError } from '../../errors/appError.js';
import logger from '../../infra/logger.js';
import { prisma } from '../../infra/prisma.js';
import {
    createCategory, deleteCategory, editCategory, getCategoryById, getCategoryFields, getCategoryList, saveCategoryFields
} from './data.js';

import type { AddCategoryInput, DeleteCategoryInput, EditCategoryInput, GetCategoryByIdInput, GetCategoryFieldsInput, SaveCategoryFieldsInput } from "./types.js"

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

export async function getCategoryByIdService({ id }: GetCategoryByIdInput) {
    try {
        const category = await getCategoryById({ id })
        if (!category) throw new AppError("CATEGORY_NOT_FOUND")
        return category
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, id }, "Error getting category by id")
        throw new AppError("CATEGORY_GET_BY_ID_ERROR")
    }
}

export async function getCategoryListService() {
    try {
        const categoryList = await getCategoryList()
        return categoryList
    } catch (err) {
        logger.error({ err }, "Error getting category list")
        throw new AppError("CATEGORY_GET_LIST_ERROR")
    }
}

export async function getCategoryFieldsService({ categoryId }: GetCategoryFieldsInput) {
    try {
        const categoryFields = await getCategoryFields({ categoryId })
        if (!categoryFields) throw new AppError("CATEGORY_NOT_FOUND")
        return categoryFields
    } catch (err) {
        if (err instanceof AppError) throw err
        logger.error({ err, categoryId }, "Error getting category fields")
        throw new AppError("CATEGORY_FIELDS_GET_ERROR")
    }
}

export async function saveCategoryFieldsService({ categoryId, fields }: SaveCategoryFieldsInput) {
    const categoryExists = await prisma.category.findUnique({
        where: {
            id: categoryId
        }
    })
    if (!categoryExists) {
        logger.warn({ categoryId }, "Category not found")
        throw new AppError("CATEGORY_NOT_FOUND")
    }

    const hasScores = await prisma.score.count({ where: { categoryId } })
    if (hasScores > 0) {
        logger.warn({ categoryId }, "Category is locked because scores exist")
        throw new AppError("CATEGORY_LOCKED")
    }
    
    try {
        await saveCategoryFields({ categoryId, fields })
    } catch (err) {
        logger.error({ err }, "Error saving category fields")
        throw new AppError("CATEGORY_FIELDS_SAVE_ERROR")
    }
}

export async function deleteCategoryService({ id }: DeleteCategoryInput) {
    const categoryExists = await prisma.category.findUnique({
        where: { id },
    })
    if (!categoryExists) {
        logger.warn({ id }, "Category not found")
        throw new AppError("CATEGORY_NOT_FOUND")
    }

    const hasScores = await prisma.score.count({ where: { categoryId: id } })
    if (hasScores > 0) {
        logger.warn({ id }, "Category is locked because scores exist")
        throw new AppError("CATEGORY_LOCKED",{messageOverride: "Category cannot be deleted because scores already exist for this category."})
    }

    try {
        await deleteCategory({ id })
    } catch (err) {
        logger.error({ err, id }, "Error deleting category")
        throw new AppError("CATEGORY_DELETE_ERROR")
    }
}