export type AddJudgeInputRequestBody = {
    name: unknown
    username: unknown
    password: unknown
}
export type AddJudgeInput = {
    name: string;
    username: string;
    password: string;
}
export type AddJudgeInputVariables = {
    addJudgeInput: AddJudgeInput
}
export type AddJudgeResponse = {
    message: string
}

// Get Judge List
export type GetJudgeListDTO = {
    id: number
    name: string
    username: string
}
export type GetJudgeListResponse = {
    data: GetJudgeListDTO[]
    message: string
}

// Edit Judge
export type EditJudgeRequestBody = {
    name: unknown
    username: unknown
}
export type EditJudgeInput = {
    id: number
    name: string
    username: string
}
export type EditJudgeInputVariables = {
    editJudgeInput: EditJudgeInput
}
export type EditJudgeResponse = {
    message: string
}

// Reset Judge Password
export type ResetJudgePasswordRequestBody = {
    password: unknown
}
export type ResetJudgePasswordInput = {
    id: number
    password: string
}
export type ResetJudgePasswordInputVariables = {
    resetJudgePasswordInput: ResetJudgePasswordInput
}
export type ResetJudgePasswordResponse = {
    message: string
}

// Delete Judge
export type DeleteJudgeInput = {
    id: number
}
export type DeleteJudgeInputVariables = {
    deleteJudgeInput: DeleteJudgeInput
}
export type DeleteJudgeResponse = {
    message: string
}