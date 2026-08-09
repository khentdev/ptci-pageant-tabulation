import { prisma } from "../../infra/prisma.js";
import type { AddRoundInput, EditRoundInput } from "./types.js";

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

export async function editRound({ id, name, contestantLimit }: EditRoundInput) {
    await prisma.round.update({
        where: {
            id
        },
        data: {
            name,
            contestantLimit
        }
    })
}

export async function getRoundById(id: number) {
    const round = await prisma.round.findUnique({
        where: { id },
        select: {
            id: true,
            phaseOrder: true,
            name: true,
            contestantLimit: true,
            _count: {
                select: {
                    roundContestants: true,
                },
            },
        },
    })

    if (!round) return null

    const { _count, ...roundData } = round
    return {
        ...roundData,
        isLimitLocked: _count.roundContestants > 0,
    }
}
