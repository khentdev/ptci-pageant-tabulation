import { Hono } from "hono"
import { Role } from "../../../generated/prisma/enums.js"
import authenticate from "../../middleware/authenticate.js"
import { requireRole } from "../../middleware/requireRole.js"
import { addContestantController, editContestantController, getAllContestantsController, getContestantByIdController } from "./controller.js"
import { validateAddContestantInput, validateEditContestantInput, validateGetAllContestantsParams, validateGetContestantByIdInput } from "./middleware.js"

const contestantsRoute = new Hono()
contestantsRoute.post("/", authenticate, requireRole(Role.ADMIN), validateAddContestantInput, addContestantController)
    .get("/", authenticate, requireRole(Role.ADMIN), validateGetAllContestantsParams, getAllContestantsController)
    .get("/:id", authenticate, requireRole(Role.ADMIN), validateGetContestantByIdInput, getContestantByIdController)
    .patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditContestantInput, editContestantController)
export default contestantsRoute
