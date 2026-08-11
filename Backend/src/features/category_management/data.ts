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

export async function getCategoryList() {
    const round = await prisma.round.findMany({
        orderBy: { phaseOrder: "asc" },
        select: {
            id: true,
            name: true,
            phaseOrder: true,
            categories: {
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            scores: true,
                            criteriaFields: true
                        }
                    },
                    criteriaFields: {
                        select: {
                            maxValue: true
                        }
                    }
                },
                orderBy: { name: "asc" }
            }
        },
    })

    return round.map((r) => ({
        id: r.id,
        name: r.name,
        phaseOrder: r.phaseOrder,
        categories: r.categories.map((c) => {
            const totalScore = c.criteriaFields.reduce((sum, field) => sum + Number(field.maxValue), 0)
            return {
                id: c.id,
                name: c.name,
                fieldCount: c._count.criteriaFields,
                totalScore,
                isLocked: c._count.scores > 0
            }
        })
    }))

}