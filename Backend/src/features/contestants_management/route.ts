import { Hono } from "hono"
import { Role } from "../../../generated/prisma/enums.js"
import authenticate from "../../middleware/authenticate.js"
import { requireRole } from "../../middleware/requireRole.js"
import { addContestantController, getAllContestantsController } from "./controller.js"
import { validateAddContestantInput, validateGetAllContestantsParams } from "./middleware.js"

const contestantsRoute = new Hono()
contestantsRoute.post("/", authenticate, requireRole(Role.ADMIN), validateAddContestantInput, addContestantController)
    .get("/", authenticate, requireRole(Role.ADMIN), validateGetAllContestantsParams, getAllContestantsController)

export default contestantsRoute
