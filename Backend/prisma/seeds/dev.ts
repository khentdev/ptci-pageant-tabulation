import { prisma } from "../../src/infra/prisma.js"
import logger from "../../src/infra/logger.js"
import {
    createCategoryWithFields,
    createContestants,
    createEmptyCategory,
    createJudge,
    createRound,
    insertRoundContestants,
    logSeedSummary,
    submitSingleFieldScores,
    wipeDevData,
    type SeedSummary,
} from "./helpers.js"

const SINGLE_FIELD = [{ name: "Overall", maxValue: 100 }]

/**
 * Top 3 is normally pre-filled/scored/declared at seed time to demo the
 * "final round already declared" state. That pre-fill also marks Top 5 as
 * isCompleted (its next round already has contestants), which suppresses
 * the tie/advancement computation even though Top 5's scores are tied.
 * --tie skips the Top 3 pre-fill so Top 5 surfaces a genuine hasTie: true —
 * FEMALE only (#103/#105 tied behind #101; the 2 males advance cleanly).
 * --tie-both is the same idea but ties BOTH genders at once (adds #106 into
 * Top 5's pool so #104/#106 tie behind #102 too), for testing that Advance
 * stays blocked until every gender's tie panel is resolved.
 * --declare fills/scores Top 3 like the default seed but stops short of the
 * direct winnersDeclaredAt/RoundWinner writes, so Declare Winners can be
 * tested through the real endpoint without needing judge scoring first.
 */
const TIE_MODE_BOTH_GENDERS = process.argv.includes("--tie-both")
const SEED_UNRESOLVED_TIE = TIE_MODE_BOTH_GENDERS || process.argv.includes("--tie")
const SEED_DECLARE_READY = process.argv.includes("--declare")

const CONTESTANT_DATA = [
    { candidateNumber: 101, name: "Keanna Reyes", gender: "FEMALE" as const, teamName: "Team Sining", teamColor: "#C41E3A" },
    { candidateNumber: 102, name: "Marcus Lin", gender: "MALE" as const, teamName: "Team Diwa", teamColor: "#1E4FC4" },
    { candidateNumber: 103, name: "Sofia Mendoza", gender: "FEMALE" as const, teamName: "Team Sining", teamColor: "#C41E3A" },
    { candidateNumber: 104, name: "Ethan Cruz", gender: "MALE" as const, teamName: "Team Lakas", teamColor: "#2E8B57" },
    { candidateNumber: 105, name: "Isabella Torres", gender: "FEMALE" as const, teamName: "Team Diwa", teamColor: "#1E4FC4" },
    { candidateNumber: 106, name: "Noah Villanueva", gender: "MALE" as const, teamName: "Team Lakas", teamColor: "#2E8B57" },
    { candidateNumber: 107, name: "Mia Santos", gender: "FEMALE" as const, teamName: "Team Sining", teamColor: "#C41E3A" },
    { candidateNumber: 108, name: "Lucas Rivera", gender: "MALE" as const, teamName: "Team Diwa", teamColor: "#1E4FC4" },
    { candidateNumber: 109, name: "Aria Delgado", gender: "FEMALE" as const, teamName: "Team Lakas", teamColor: "#2E8B57" },
    { candidateNumber: 110, name: "Gabriel Tan", gender: "MALE" as const, teamName: "Team Sining", teamColor: "#C41E3A" },
    { candidateNumber: 111, name: "Chloe Ramos", gender: "FEMALE" as const, teamName: "Team Diwa", teamColor: "#1E4FC4" },
    { candidateNumber: 112, name: "Daniel Ong", gender: "MALE" as const, teamName: "Team Lakas", teamColor: "#2E8B57" },
]

async function seedDev() {
    await wipeDevData()

    const [judgeMaria, judgeJuan] = await Promise.all([
        createJudge({ name: "Maria Santos", username: "judge.maria" }),
        createJudge({ name: "Juan Dela Cruz", username: "judge.juan" }),
    ])

    const contestants = await createContestants(CONTESTANT_DATA)
    const byNumber = new Map(contestants.map(c => [c.candidateNumber, c]))
    const topTenIds = contestants
        .filter(c => c.candidateNumber <= 110)
        .map(c => c.id)
    const topFiveCandidateNumbers = TIE_MODE_BOTH_GENDERS
        ? [101, 102, 103, 104, 105, 106]
        : [101, 102, 103, 104, 105]
    const topFiveIds = contestants
        .filter(c => topFiveCandidateNumbers.includes(c.candidateNumber))
        .map(c => c.id)

    /**
     * contestantLimit is a per-gender cutoff (advancement/declare-winners run
     * independently per gender), so "Top 10"/"Top 5"/"Top 3" mean up to
     * double that number once both genders are counted. Top 3's limit is 2
     * (not 3) so the Top 5 -> Top 3 tie demo below stays genuine per gender
     * instead of trivially fitting everyone.
     */
    const prelims = await createRound({ name: "Preliminary", phaseOrder: 1, contestantLimit: null })
    const top10 = await createRound({ name: "Top 10", phaseOrder: 2, contestantLimit: 10 })
    const top5 = await createRound({ name: "Top 5", phaseOrder: 3, contestantLimit: 5 })
    const top3 = await createRound({ name: "Top 3", phaseOrder: 4, contestantLimit: 2 })

    /**
     * Spare Round / Advancement Only only exist in the default seed. They
     * sit above Top 3 in phaseOrder purely to exercise round delete-guard
     * scenarios (see SEED_REFERENCE.md). Keeping them under --tie or
     * --declare would make Top 3's nextRound resolve to Spare Round instead
     * of null, which permanently blocks canDeclareWinners no matter how
     * fully Top 3 is scored — so both variants must skip them to leave
     * Top 3 genuinely final for real Declare Winners testing.
     */
    const skipDecoyRounds = SEED_UNRESOLVED_TIE || SEED_DECLARE_READY
    const spare = skipDecoyRounds
        ? null
        : await createRound({ name: "Spare Round", phaseOrder: 5, contestantLimit: 5 })
    const advancementOnly = skipDecoyRounds
        ? null
        : await createRound({ name: "Advancement Only", phaseOrder: 6, contestantLimit: 2 })

    // --- Preliminary: full scores, already advanced to Top 10 ---
    const prelimsSwimwear = await createCategoryWithFields(prelims.id, "Swimwear", SINGLE_FIELD)
    const prelimsTalent = await createCategoryWithFields(prelims.id, "Talent", SINGLE_FIELD)
    const prelimsGown = await createCategoryWithFields(prelims.id, "Evening Gown", SINGLE_FIELD)

    const prelimsCategories = [prelimsSwimwear, prelimsTalent, prelimsGown]
    const scoredContestants = contestants.filter(c => c.candidateNumber <= 110)

    for (const category of prelimsCategories) {
        for (const judge of [judgeMaria, judgeJuan]) {
            await submitSingleFieldScores(
                judge.id,
                category,
                scoredContestants.map(c => ({
                    contestantId: c.id,
                    total: 100 - (c.candidateNumber - 101),
                })),
            )
        }
    }

    await insertRoundContestants(top10.id, topTenIds)

    // --- Top 10: partial scoring (State 1) ---
    const top10Production = await createCategoryWithFields(top10.id, "Production Number", SINGLE_FIELD)
    const top10Formal = await createCategoryWithFields(top10.id, "Formal Wear", SINGLE_FIELD)
    await createEmptyCategory(top10.id, "Q&A")

    const top10Contestants = scoredContestants.map(c => ({
        contestantId: c.id,
        total: 80 + (c.candidateNumber % 5),
    }))

    await submitSingleFieldScores(judgeMaria.id, top10Production, top10Contestants)
    await submitSingleFieldScores(judgeMaria.id, top10Formal, top10Contestants)
    await submitSingleFieldScores(judgeJuan.id, top10Production, top10Contestants)

    // --- Top 5: tie at cutoff (State 2b) ---
    const top5Swimwear = await createCategoryWithFields(top5.id, "Swimwear", SINGLE_FIELD)
    const top5Talent = await createCategoryWithFields(top5.id, "Talent", SINGLE_FIELD)

    await insertRoundContestants(top5.id, topFiveIds)

    // FEMALE: #101 clear leader, #103/#105 tied behind at the cutoff (limit 2).
    // MALE (--tie-both only): #102 clear leader, #104/#106 tied the same way.
    const top5ScoreMap = TIE_MODE_BOTH_GENDERS
        ? [
            { number: 101, total: 95 },
            { number: 102, total: 92 },
            { number: 103, total: 88 },
            { number: 104, total: 88 },
            { number: 105, total: 88 },
            { number: 106, total: 88 },
        ]
        : [
            { number: 101, total: 95 },
            { number: 102, total: 92 },
            { number: 103, total: 88 },
            { number: 104, total: 88 },
            { number: 105, total: 88 },
        ]

    for (const category of [top5Swimwear, top5Talent]) {
        for (const judge of [judgeMaria, judgeJuan]) {
            await submitSingleFieldScores(
                judge.id,
                category,
                top5ScoreMap.map(({ number, total }) => ({
                    contestantId: byNumber.get(number)!.id,
                    total,
                })),
            )
        }
    }

    // --- Top 3: final round — categories always ready for scoring ---
    const top3EveningWear = await createCategoryWithFields(top3.id, "Evening Wear", SINGLE_FIELD)
    const top3Qa = await createCategoryWithFields(top3.id, "Q&A", SINGLE_FIELD)

    if (!SEED_UNRESOLVED_TIE) {
        // --- pool filled, fully scored; declared unless --declare ---
        const topThreeIds = [101, 102, 103].map(number => byNumber.get(number)!.id)
        await insertRoundContestants(top3.id, topThreeIds)

        const top3ScoreMap = [
            { number: 101, total: 95 },
            { number: 102, total: 88 },
            { number: 103, total: 82 },
        ]

        for (const category of [top3EveningWear, top3Qa]) {
            for (const judge of [judgeMaria, judgeJuan]) {
                await submitSingleFieldScores(
                    judge.id,
                    category,
                    top3ScoreMap.map(({ number, total }) => ({
                        contestantId: byNumber.get(number)!.id,
                        total,
                    })),
                )
            }
        }

        if (!SEED_DECLARE_READY) {
            await prisma.round.update({
                where: { id: top3.id },
                data: { winnersDeclaredAt: new Date() },
            })
            await prisma.roundWinner.createMany({
                data: [
                    // Placement is per gender: #101/#103 (FEMALE) and #102 (MALE) each start at 1.
                    { roundId: top3.id, contestantId: byNumber.get(101)!.id, gender: "FEMALE", placement: 1, overallScore: 95 },
                    { roundId: top3.id, contestantId: byNumber.get(103)!.id, gender: "FEMALE", placement: 2, overallScore: 82 },
                    { roundId: top3.id, contestantId: byNumber.get(102)!.id, gender: "MALE", placement: 1, overallScore: 88 },
                ],
            })
        }
    }

    // --- Advancement Only: contestants without categories (delete guard test) ---
    if (advancementOnly) {
        await insertRoundContestants(advancementOnly.id, [
            byNumber.get(111)!.id,
            byNumber.get(112)!.id,
        ])
    }

    const summary: SeedSummary = {
        rounds: {
            prelims,
            top10,
            top5,
            top3,
            ...(spare ? { spare } : {}),
            ...(advancementOnly ? { advancementOnly } : {}),
        },
        contestants,
        judges: {
            maria: judgeMaria,
            juan: judgeJuan,
        },
        mode: TIE_MODE_BOTH_GENDERS ? "tie-both" : SEED_UNRESOLVED_TIE ? "tie" : SEED_DECLARE_READY ? "declare" : "default",
    }

    logSeedSummary(summary)
}

seedDev()
    .then(async () => await prisma.$disconnect())
    .catch(async (err) => {
        logger.error(err, "Error seeding dev data")
        await prisma.$disconnect()
        process.exit(1)
    })
