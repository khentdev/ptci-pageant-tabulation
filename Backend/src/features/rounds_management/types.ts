export type AddRoundRequestBody = {
    name: unknown
    phaseOrder: unknown
    contestantLimit?: unknown
}
export type AddRoundInput = {
    name: string
    phaseOrder: number
    contestantLimit?: number | null
}
export type AddRoundInputVariables = {
    roundInput: AddRoundInput
}
export type AddRoundResponse = {
    message: string
}

// Get rounds list
export type GetRoundsListDTO = {
    id: number
    phaseOrder: number
    name: string
    contestantLimit: number | null
}
export type GetRoundsListResponse = {
    data: GetRoundsListDTO[]
    message: string
}