export type AddCategoryRequestBody = {
    name: unknown
    roundId: unknown
}
export type AddCategoryInput = {
    name: string
    roundId: number
}
export type AddCategoryInputVariables = {
    addCategoryInput: AddCategoryInput
}
export type AddCategoryResponse = {
    message: string
}

// Edit Category
export type EditCategoryRequestBody = {
    name: unknown
}
export type EditCategoryInput = {
    id: number
    name: string
}
export type EditCategoryInputVariables = {
    editCategoryInput: EditCategoryInput
}
export type EditCategoryResponse = {
    message: string
}