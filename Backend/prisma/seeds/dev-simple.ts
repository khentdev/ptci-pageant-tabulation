import { prisma } from "../../src/infra/prisma.js"
import logger from "../../src/infra/logger.js"
import {
    createCategoryWithFields,
    createChairman,
    createContestants,
    createJudge,
    createRound,
    logSeedSummary,
    wipeDevData,
    type SeedSummary,
} from "./helpers.js"

/**
 * A smaller, structure-only alternative to `dev.ts`: 12 contestants (6
 * FEMALE, 6 MALE), 3 rounds (Preliminary -> Top 5 -> Top 3, no Top 10 /
 * decoy rounds), 2 categories per round, each with 2 fields worth 50 points
 * (summing to 100). No scores and no round pools are pre-seeded — Top 5 and
 * Top 3 start empty so the full flow (judge scoring -> advance -> judge
 * scoring -> declare winners) can be exercised end-to-end through the real
 * UI/API from a clean slate. Also seeds one Chairman account (`chairman.diaz`)
 * for manually testing tie-resolution as that role.
 */
const TWO_FIELDS = [
    { name: "Presentation", maxValue: 50 },
    { name: "Overall Impact", maxValue: 50 },
]

const CONTESTANT_DATA = [
    { candidateNumber: 201, name: "Elena Cruz", gender: "FEMALE" as const, teamName: "Team Alpha", teamColor: "#C41E3A" },
    { candidateNumber: 202, name: "Miguel Santos", gender: "MALE" as const, teamName: "Team Beta", teamColor: "#1E4FC4" },
    { candidateNumber: 203, name: "Camille Reyes", gender: "FEMALE" as const, teamName: "Team Alpha", teamColor: "#C41E3A" },
    { candidateNumber: 204, name: "Rafael Lim", gender: "MALE" as const, teamName: "Team Beta", teamColor: "#1E4FC4" },
    { candidateNumber: 205, name: "Bianca Torres", gender: "FEMALE" as const, teamName: "Team Alpha", teamColor: "#C41E3A" },
    { candidateNumber: 206, name: "Diego Ramos", gender: "MALE" as const, teamName: "Team Beta", teamColor: "#1E4FC4" },
    { candidateNumber: 207, name: "Faith Villanueva", gender: "FEMALE" as const, teamName: "Team Alpha", teamColor: "#C41E3A" },
    { candidateNumber: 208, name: "Gabriel Ong", gender: "MALE" as const, teamName: "Team Beta", teamColor: "#1E4FC4" },
    { candidateNumber: 209, name: "Hannah Delgado", gender: "FEMALE" as const, teamName: "Team Alpha", teamColor: "#C41E3A" },
    { candidateNumber: 210, name: "Ivan Tan", gender: "MALE" as const, teamName: "Team Beta", teamColor: "#1E4FC4" },
    { candidateNumber: 211, name: "Jasmine Rivera", gender: "FEMALE" as const, teamName: "Team Alpha", teamColor: "#C41E3A" },
    { candidateNumber: 212, name: "Kevin Bautista", gender: "MALE" as const, teamName: "Team Beta", teamColor: "#1E4FC4" },
]

async function seedDevSimple() {
    await wipeDevData()

    const [judgeAya, judgeBen, chairmanDiaz] = await Promise.all([
        createJudge({ name: "Aya Santos", username: "judge.aya" }),
        createJudge({ name: "Ben Cruz", username: "judge.ben" }),
        createChairman({ name: "Carmen Diaz", username: "chairman.diaz" }),
    ])

    const contestants = await createContestants(CONTESTANT_DATA)

    const prelims = await createRound({ name: "Preliminary", phaseOrder: 1, contestantLimit: null })
    const top5 = await createRound({ name: "Top 5", phaseOrder: 2, contestantLimit: 5 })
    const top3 = await createRound({ name: "Top 3", phaseOrder: 3, contestantLimit: 3 })

    await createCategoryWithFields(prelims.id, "Swimwear", TWO_FIELDS)
    await createCategoryWithFields(prelims.id, "Evening Gown", TWO_FIELDS)

    await createCategoryWithFields(top5.id, "Talent", TWO_FIELDS)
    await createCategoryWithFields(top5.id, "Casual Wear", TWO_FIELDS)

    await createCategoryWithFields(top3.id, "Evening Wear", TWO_FIELDS)
    await createCategoryWithFields(top3.id, "Q&A", TWO_FIELDS)

    const summary: SeedSummary = {
        rounds: { prelims, top5, top3 },
        contestants,
        judges: { aya: judgeAya, ben: judgeBen, diaz: chairmanDiaz },
        mode: "simple",
    }

    logSeedSummary(summary)
}

seedDevSimple()
    .then(async () => await prisma.$disconnect())
    .catch(async (err) => {
        logger.error(err, "Error seeding simple dev data")
        await prisma.$disconnect()
        process.exit(1)
    })
