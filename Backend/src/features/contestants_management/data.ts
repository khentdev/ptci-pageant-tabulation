import { prisma } from "../../infra/prisma.js";
import type { AddContestantInput } from "./types.js";

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