import { prisma } from "../../infra/prisma.js";
import type { AddRoundInput } from "./types.js";

export async function addRound({ name, phaseOrder, contestantLimit }: AddRoundInput) {
    await prisma.round.create({
        data: {
            name,
            phaseOrder,
            contestantLimit,
        },
        select: {
            id: true,
        },
    })
}

export async function getRoundsList() {
    return await prisma.round.findMany({
        orderBy: { phaseOrder: "asc" },
        select: {
            id: true,
            phaseOrder: true,
            name: true,
            contestantLimit: true,
        }
    })
}