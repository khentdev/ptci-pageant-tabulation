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

// Edit round
export type EditRoundRequestBody = {
    name: unknown
    contestantLimit?: unknown
}
export type EditRoundInput = {
    id: number
    name: string
    contestantLimit: number | null
}
export type EditRoundInputVariables = {
    editRoundInput: EditRoundInput
}
export type EditRoundResponse = {
    message: string
}

// Get round by id
export type GetRoundByIdInput = {
    id: number
}
export type GetRoundByIdInputVariables = {
    getRoundByIdInput: GetRoundByIdInput
}
export type GetRoundByIdDTO = {
    id: number
    phaseOrder: number
    name: string
    contestantLimit: number | null
    isLimitLocked: boolean
}
export type GetRoundByIdResponse = {
    data: GetRoundByIdDTO
    message: string
}

// Delete round
export type DeleteRoundPhaseInput = {
    id: number
}
export type DeleteRoundPhaseInputVariables = {
    deleteRoundPhaseInput: DeleteRoundPhaseInput
}
export type DeleteRoundPhaseResponse = {
    message: string
}