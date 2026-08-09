import { prisma } from "../../infra/prisma.js";
import type { AddCategoryInput } from "./types.js";

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