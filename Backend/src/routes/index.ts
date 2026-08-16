
import { Hono } from "hono";
import authRoutes from "../features/auth/route.js";
import sessionRoutes from "../features/session/route.js";
import categoryRoutes from "../features/category_management/route.js"
import roundRoutes from "../features/rounds_management/route.js"
import contestantsRoutes from "../features/contestants_management/route.js"
import { judgeRoutes } from "../features/judge_management/route.js";

export function registerAppRoutes(app: Hono) {
    app.get("/", (c) => c.redirect("/health-check"))
    app.get("/health-check", (c) => c.json({ status: "Server status is good." }, 200))
    app.route("/auth", authRoutes)
    app.route("/session", sessionRoutes)
    app.route("/rounds", roundRoutes)
    app.route("/categories", categoryRoutes)
    app.route("/contestants", contestantsRoutes)
    app.route("/judges", judgeRoutes)
}

