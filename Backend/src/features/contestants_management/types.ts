export type Gender = "MALE" | "FEMALE"
export type AddContestantRequestBody = {
    candidateNumber: unknown
    name: unknown
    gender: unknown
    teamName: unknown
    teamColor: unknown
}
export type AddContestantInput = {
    candidateNumber: number
    name: string
    gender: Gender
    teamName: string
    teamColor: string
}
export type AddContestantInputVariables = {
    addContestantInput: AddContestantInput
}
export type AddContestantResponse = {
    message: string
}