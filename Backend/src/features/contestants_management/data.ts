import { Prisma, prisma } from '../../infra/prisma.js';

import type { AddContestantInput, EditContestantInput, Gender, GetAllContestantsParams, GetContestantByIdInput } from "./types.js";

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

export async function getContestantById({ id }: GetContestantByIdInput) {
    const contestant = await prisma.contestant.findUnique({
        where: { id },
        select: {
            id: true,
            candidateNumber: true,
            name: true,
            gender: true,
            teamName: true,
            teamColor: true,
            _count: {
                select: {
                    scores: true,
                },
            },
        },
    })

    if (!contestant) return null

    const { _count, ...contestantData } = contestant
    return {
        id: contestantData.id,
        candidateNumber: contestantData.candidateNumber,
        name: contestantData.name,
        gender: contestantData.gender,
        teamName: contestantData.teamName,
        teamColor: contestantData.teamColor,
        isLocked: _count.scores > 0,
    }
}

export async function editContestant({ id, candidateNumber, name, gender, teamName, teamColor }: EditContestantInput) {
    await prisma.contestant.update({
        where: { id },
        data: { candidateNumber, name, gender, teamName, teamColor },
        select: {
            id: true,
        }
    })
}