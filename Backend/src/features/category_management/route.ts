import { Hono } from "hono"

import { Role } from "../../../generated/prisma/enums.js"
import authenticate from "../../middleware/authenticate.js"
import { requireRole } from "../../middleware/requireRole.js"
import { addCategoryController } from "./controller.js"
import { validateAddCategoryInput } from "./middleware.js"

const categoryRoutes = new Hono()
categoryRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddCategoryInput, addCategoryController)
export default categoryRoutes
