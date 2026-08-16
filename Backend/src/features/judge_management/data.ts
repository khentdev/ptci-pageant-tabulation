import { Role } from '../../../generated/prisma/enums.js';
import { prisma } from '../../infra/prisma.js';

import type { AddJudgeInput } from "./types.js";

export async function addJudge({ name, username, password }: AddJudgeInput) {
    await prisma.user.create({
        data: { name, username, hashedPassword: password, role: Role.JUDGE },
        select: { id: true },
    })
}

export async function getJudgeList() {
    return await prisma.user.findMany({
        where: { role: Role.JUDGE },
        select: { id: true, name: true, username: true },
    })
}