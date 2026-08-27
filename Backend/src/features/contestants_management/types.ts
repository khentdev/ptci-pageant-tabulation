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

// Get all contestants
export type GetAllContestantsParams = {
    filter?: Gender
}
export type GetAllContestantsParamsVariables = {
    getAllContestantsParams: GetAllContestantsParams
}
export type GetAllContestantsDTO = {
    id: number;
    candidateNumber: number;
    name: string;
    gender: Gender;
    teamName: string;
    teamColor: string;
}
export type GetAllContestantsResponse = {
    data: GetAllContestantsDTO[]
    message: string
}

// Get contestant by id
export type GetContestantByIdInput = {
    id: number
}
export type GetContestantByIdInputVariables = {
    getContestantByIdInput: GetContestantByIdInput
}
export type GetContestantByIdDTO = {
    id: number
    candidateNumber: number
    name: string
    gender: Gender
    teamName: string
    teamColor: string
    isLocked: boolean
}
export type GetContestantByIdResponse = {
    data: GetContestantByIdDTO
    message: string
}

// Edit contestant
export type EditContestantRequestBody = {
    candidateNumber: unknown
    name: unknown
    gender: unknown
    teamName: unknown
    teamColor: unknown
}
export type EditContestantInput = {
    id: number
    candidateNumber: number
    name: string
    gender: Gender
    teamName: string
    teamColor: string
}
export type EditContestantInputVariables = {
    editContestantInput: EditContestantInput
}
export type EditContestantResponse = {
    message: string
}

// Delete contestant
export type DeleteContestantInput = {
    id: number
}
export type DeleteContestantInputVariables = {
    deleteContestantInput: DeleteContestantInput
}
export type DeleteContestantResponse = {
    message: string
}