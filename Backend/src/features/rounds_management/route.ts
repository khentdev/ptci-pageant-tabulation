import { Hono } from "hono";
import { Role } from "../../../generated/prisma/enums.js";
import authenticate from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { addRoundController } from "./controller.js";
import { validateAddRoundInput } from "./middleware.js";

const roundRoutes = new Hono()
roundRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddRoundInput, addRoundController)

export default roundRoutes
