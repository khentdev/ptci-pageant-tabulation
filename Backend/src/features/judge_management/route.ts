import { Hono } from "hono";
import { addJudgeController } from "./controller.js";
import { validateAddJudgeInput } from "./middleware.js";
import authenticate from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { Role } from "../../../generated/prisma/enums.js";

export const judgeRoutes = new Hono()
judgeRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddJudgeInput, addJudgeController)