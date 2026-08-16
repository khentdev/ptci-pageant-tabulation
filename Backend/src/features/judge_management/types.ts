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