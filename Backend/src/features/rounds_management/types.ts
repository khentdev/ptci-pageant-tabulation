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