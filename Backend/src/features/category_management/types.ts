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

// Get Category by ID
export type GetCategoryByIdInput = {
    id: number
}
export type GetCategoryByIdInputVariables = {
    getCategoryByIdInput: GetCategoryByIdInput
}
export type GetCategoryByIdDTO = {
    id: number;
    roundId: number;
    name: string;
    roundName: string;
    isLocked: boolean
}
export type GetCategoryByIdResponse = {
    data: GetCategoryByIdDTO
    message: string
}

// Get Category List
export type CategoryDTO = {
    id: number;
    name: string;
    fieldCount: number;
    totalScore: number;
    isLocked: boolean;
}
export type GetCategoryListDTO = {
    id: number;
    name: string;
    phaseOrder: number;
    categories: CategoryDTO[]
}
export type GetCategoryListResponse = {
    data: GetCategoryListDTO[]
    message: string
}