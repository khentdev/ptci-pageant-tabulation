import { Role } from '../../../generated/prisma/enums.js';
import { prisma } from '../../infra/prisma.js';

import type { AddJudgeInput, DeleteJudgeInput, EditJudgeInput, JudgeAssignableRole, ResetJudgePasswordInput } from "./types.js";

export async function addJudge({ name, username, password, role }: AddJudgeInput) {
    await prisma.user.create({
        data: { name, username, hashedPassword: password, role },
        select: { id: true },
    })
}

export async function getJudgeList() {
    const judges = await prisma.user.findMany({
        where: { role: { in: [Role.JUDGE, Role.CHAIRMAN] } },
        select: { id: true, name: true, username: true, role: true },
    })

    // Narrow from Prisma's full `Role` to the assignable subset — the query
    // above guarantees only JUDGE/CHAIRMAN rows are ever returned.
    return judges.map(judge => ({ ...judge, role: judge.role as JudgeAssignableRole }))
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