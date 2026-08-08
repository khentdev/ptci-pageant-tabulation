// Login
export type LoginInputRequestBody = {
    username: unknown
    password: unknown
}
export type LoginInput = {
    username: string
    password: string
    deviceId: string
}
export type LoginInputVariables = {
    LoginInput: LoginInput
}
export type Role = "ADMIN" | "JUDGE"
export type LoginDTO = {
    user: {
        id: number
        name: string
        username: string
        role: Role
    }
}
export type LoginResponse = {
    data: LoginDTO
    message: string
}