import { prisma } from "../../infra/prisma.js";
import type { AddCategoryInput, EditCategoryInput } from "./types.js";

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