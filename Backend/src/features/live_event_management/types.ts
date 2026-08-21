export type GetJudgeSubmissions = {
    id: number
}
export type GetJudgeSubmissionsInputVariables = {
    getJudgeSubmissions: GetJudgeSubmissions
}
type JudgeSubmission = {
    judge: {
        id: number
        name: string
    }
    categories: {
        id: number
        name: string
        submitted: boolean
    }[]
    fullySubmitted: boolean
}
export type GetJudgeSubmissionsDTO = {
    judgeSubmissions: JudgeSubmission[]
    fullySubmittedCount: number
    totalJudges: number
    allJudgesSubmitted: boolean
}
export type GetJudgeSubmissionsResponse = {
    data: GetJudgeSubmissionsDTO
    message: string
}

// Round Results
export type GetRoundResultsById = {
    id: number
    phaseOrder: number
}
export type GetRoundResultsInputVariables = {
    getRoundResults: Omit<GetRoundResultsById, "phaseOrder">
}
export type CanAdvanceReason =
    | "ROUND_COMPLETED"
    | "JUDGES_NOT_COMPLETE"
    | "CURRENT_ROUND_NO_CATEGORIES"
    | "NEXT_ROUND_ALREADY_FILLED"
    | "NEXT_ROUND_NO_CATEGORIES"

type RankingCategoryScore = {
    id: number
    name: string
    avgScore: number | null
}
type RankingRow = {
    contestant: {
        id: number
        candidateNumber: number
        name: string
    }
    categories: RankingCategoryScore[]
    overallScore: number | null
    rank: number | null
}
type AdvancementContestant = {
    id: number
    name: string
    overallScore: number
}
export type GetRoundResultsDTO = {
    rankings: RankingRow[]
    allJudgesSubmitted: boolean
    isCompleted: boolean
    canAdvance: boolean
    canAdvanceReason: CanAdvanceReason | null
    canDeclareWinners: boolean
    winnersDeclaredAt: string | null
    nextRound: {
        id: number
        name: string
        contestantLimit: number | null
        categoryCount: number
    } | null
    advancement: {
        hasTie: boolean
        requiredSelections: number
        included: AdvancementContestant[]
        tied: AdvancementContestant[]
    }
}
export type GetRoundResultsResponse = {
    data: GetRoundResultsDTO
    message: string
}
