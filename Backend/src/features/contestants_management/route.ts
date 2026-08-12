import { Hono } from "hono"
import { Role } from "../../../generated/prisma/enums.js"
import authenticate from "../../middleware/authenticate.js"
import { requireRole } from "../../middleware/requireRole.js"
import { addContestantController } from "./controller.js"
import { validateAddContestantInput } from "./middleware.js"

const contestantsRoute = new Hono()
contestantsRoute.post(
    "/",
    authenticate,
    requireRole(Role.ADMIN),
    validateAddContestantInput,
    addContestantController,
)

export default contestantsRoute
