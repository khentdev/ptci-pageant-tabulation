import { env } from "../configs/env.js"
const getRequestsOrigin = (): string[] => {
    if (env.NODE_ENV === "development") {
        return [
            "http://localhost:5173",
            "http://localhost:4173",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4173",
        ]
    }

    return [env.FRONTEND_PROD_URL]
}
export default getRequestsOrigin