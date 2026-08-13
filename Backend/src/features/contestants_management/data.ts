import { Prisma, prisma } from '../../infra/prisma.js';

import type { AddContestantInput, Gender, GetAllContestantsParams } from "./types.js";

export async function addContestant({ candidateNumber, name, gender, teamName, teamColor }: AddContestantInput) {
    await prisma.contestant.create({
        data: {
            candidateNumber,
            name,
            gender,
            teamName,
            teamColor,
        },
        select: {
            id: true,
        }
    })
}

export async function getAllContestants({ filter = undefined }: GetAllContestantsParams) {
    const contestants = await prisma.contestant.findMany({
        where: filter ? { gender: filter } : undefined,
        select: {
            candidateNumber: true,
            name: true,
            gender: true,
            teamName: true,
            teamColor: true,
        },
        orderBy: {
            candidateNumber: "asc",
        }
    })
    return contestants
}