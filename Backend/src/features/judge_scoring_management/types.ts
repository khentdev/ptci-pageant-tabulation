// Get Judge Rounds (sidebar)
export type GetJudgeRoundsCategoryDTO = {
    id: number
    name: string
}
export type GetJudgeRoundsDTO = {
    id: number
    name: string
    phaseOrder: number
    hasContestants: boolean
    categories: GetJudgeRoundsCategoryDTO[]
}
export type GetJudgeRoundsResponse = {
    data: GetJudgeRoundsDTO[]
    message: string
}

// Get Round Contestants
export type GetRoundContestantsParams = {
    id: number
    phaseOrder: number
}
export type GetRoundContestantsInput = Omit<GetRoundContestantsParams, "phaseOrder">
export type GetRoundContestantsInputVariables = {
    getRoundContestantsInput: GetRoundContestantsInput
}
export type GetRoundContestantsDTO = {
    id: number
    candidateNumber: number
    name: string
}
export type GetRoundContestantsResponse = {
    data: GetRoundContestantsDTO[]
    message: string
}

// Get Category Scoring Fields
export type GetCategoryScoringFieldsInput = {
    id: number
}
export type GetCategoryScoringFieldsInputVariables = {
    getCategoryScoringFieldsInput: GetCategoryScoringFieldsInput
}
export type CategoryScoringFieldDTO = {
    id: number
    name: string
    maxValue: number
}
export type GetCategoryScoringFieldsDTO = {
    categoryId: number
    categoryName: string
    roundId: number
    fields: CategoryScoringFieldDTO[]
}
export type GetCategoryScoringFieldsResponse = {
    data: GetCategoryScoringFieldsDTO
    message: string
}

// Get My Category Scores
export type GetMyCategoryScoresInput = {
    id: number
    judgeId: number
}
export type GetMyCategoryScoresInputVariables = {
    getMyCategoryScoresInput: GetMyCategoryScoresInput
}
export type MyCategoryScoreDTO = {
    contestantId: number
    criteriaFieldId: number
    value: number
}
export type GetMyCategoryScoresDTO = {
    isSubmitted: boolean
    scores: MyCategoryScoreDTO[]
}
export type GetMyCategoryScoresResponse = {
    data: GetMyCategoryScoresDTO
    message: string
}

// Submit Category Scores
export type SubmitCategoryScoresRequestBody = {
    scores: unknown
}
export type SubmitCategoryScoreEntry = {
    contestantId: number
    criteriaFieldId: number
    value: string
}
export type SubmitCategoryScoresInput = {
    id: number
    judgeId: number
    scores: SubmitCategoryScoreEntry[]
}
export type SubmitCategoryScoresInputVariables = {
    submitCategoryScoresInput: SubmitCategoryScoresInput
}
export type SubmitCategoryScoresResponse = {
    message: string
}
