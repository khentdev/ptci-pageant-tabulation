import type { Context } from "hono";
import type { AppContext } from "../../types/context.js";
import type { LoginResponse, LoginInputVariables } from "./types.js";
import { loginService } from "./service.js";
import { setCsrfTokenCookie, setSessionCookie } from "../../lib/cookies.js";
import { tokenExpiry } from "../../lib/jwt/tokens.js";

export async function loginController(c: Context<AppContext<LoginInputVariables>>) {
    const { username, password, deviceId } = c.var.LoginInput
    const { sessionToken, csrfToken, user } = await loginService({ username, password, deviceId })

    await setSessionCookie({ c, token: sessionToken, maxAge: tokenExpiry().sessionTokenMaxAge })
    setCsrfTokenCookie({ c, token: csrfToken, maxAge: tokenExpiry().csrfTokenMaxAge })

    return c.json<LoginResponse>({
        data: {
            user,
        },
        message: "Logged in successfully",
    }, 200)
}