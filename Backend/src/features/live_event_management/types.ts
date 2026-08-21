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
