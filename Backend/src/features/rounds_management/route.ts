import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { addRoundController, editRoundController, getRoundByIdController, getRoundsListController } from './controller.js';
import { validateAddRoundInput, validateEditRoundInput, validateGetRoundByIdInput } from './middleware.js';

const roundRoutes = new Hono()
roundRoutes.
    get("/", authenticate, requireRole(Role.ADMIN), getRoundsListController).
    get("/:id", authenticate, requireRole(Role.ADMIN), validateGetRoundByIdInput, getRoundByIdController).
    patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditRoundInput, editRoundController).
    post("/", authenticate, requireRole(Role.ADMIN), validateAddRoundInput, addRoundController)
export default roundRoutes
