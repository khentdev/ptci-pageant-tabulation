import { prisma } from "../../infra/prisma.js";
import type { AddCategoryInput, EditCategoryInput, GetCategoryByIdInput } from "./types.js";

export async function createCategory({ name, roundId }: AddCategoryInput) {
    await prisma.category.create({
        data: {
            roundId,
            name
        },
        select: {
            id: true,
            roundId: true,
            name: true,
        }
    })
}

export async function editCategory({ id, name }: EditCategoryInput) {
    await prisma.category.update({
        where: { id },
        data: { name },
        select: {
            id: true,
            roundId: true,
            name: true,
        }
    })
}

export async function getCategoryById({ id }: GetCategoryByIdInput) {
    const category = await prisma.category.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            roundId: true,
            round: {
                select: {
                    name: true,
                }
            },
            _count: {
                select: {
                    scores: true
                }
            }
        }
    })

    if (!category) return null

    const { _count, ...categoryData } = category
    return {
        id: categoryData.id,
        roundId: categoryData.roundId,
        name: categoryData.name,
        roundName: categoryData.round.name,
        isLocked: _count.scores > 0,
    }
}