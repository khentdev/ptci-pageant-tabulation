import { Role } from '../../../generated/prisma/enums.js';
import { prisma } from '../../infra/prisma.js';

import type { AddJudgeInput, DeleteJudgeInput, EditJudgeInput, ResetJudgePasswordInput } from "./types.js";

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

export async function editJudge({ id, name, username }: EditJudgeInput) {
    await prisma.user.update({
        where: { id },
        data: { name, username },
        select: { id: true },
    })
}

export async function resetJudgePassword({ id, password }: ResetJudgePasswordInput) {
    await prisma.user.update({
        where: { id },
        data: { hashedPassword: password },
        select: { id: true },
    })
}

export async function deleteJudge({ id }: DeleteJudgeInput) {
    await prisma.user.delete({
        where: { id },
    })
}