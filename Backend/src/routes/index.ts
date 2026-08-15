
import { Hono } from "hono";
import authRoutes from "../features/auth/route.js";
import sessionRoutes from "../features/session/route.js";

export function registerAppRoutes(app: Hono) {
    app.get("/", (c) => c.redirect("/health-check"))
    app.get("/health-check", (c) => c.json({ status: "Server status is good." }, 200))
    app.route("/auth", authRoutes)
    app.route("/session", sessionRoutes)
}

