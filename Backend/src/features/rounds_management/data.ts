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