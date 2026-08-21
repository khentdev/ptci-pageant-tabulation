import { prisma } from "../../infra/prisma.js";
import type { GetJudgeSubmissions } from "./types.js";
import { Role } from "../../../generated/prisma/enums.js";

export async function getJudgeSubmissions({ id }: GetJudgeSubmissions) {
    return await prisma.$transaction(async (tx) => {
        const judges = await tx.user.findMany({
            where: {
                role: Role.JUDGE
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" }
        })
        const categories = await tx.category.findMany({
            where: {
                roundId: id
            },
            select: {
                id: true,
                name: true
            },
            orderBy: { name: "asc" }
        })
        const submittedPairs = await tx.score.findMany({
            where: {
                category: {
                    roundId: id
                },
                judge: {
                    role: Role.JUDGE
                }
            },
            select: {
                judgeId: true,
                categoryId: true
            },
            distinct: ["judgeId", "categoryId"]
        })
        const submittedSet = new Set(submittedPairs.map(p => `${p.judgeId}-${p.categoryId}`))

        const judgeSubmissions = judges.map(j => {
            const categoryFlags = categories.map(c => ({
                id: c.id,
                name: c.name,
                submitted: submittedSet.has(`${j.id}-${c.id}`)
            }))
            return {
                judge: { id: j.id, name: j.name },
                categories: categoryFlags,
                fullySubmitted: categoryFlags.every(c => c.submitted)
            }
        })

        const fullySubmittedCount = judgeSubmissions.filter(j => j.fullySubmitted).length
        const allJudgesSubmitted = judges.length > 0 && judgeSubmissions.every(j => j.fullySubmitted)

        return {
            judgeSubmissions,
            fullySubmittedCount,
            totalJudges: judges.length,
            allJudgesSubmitted,
        }
    })
}