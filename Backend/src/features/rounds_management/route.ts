import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { addRoundController, editRoundController, getRoundsListController } from './controller.js';
import { validateAddRoundInput, validateEditRoundInput } from './middleware.js';

const roundRoutes = new Hono()
roundRoutes.
    patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditRoundInput, editRoundController).
    post("/", authenticate, requireRole(Role.ADMIN), validateAddRoundInput, addRoundController).
    get("/", authenticate, requireRole(Role.ADMIN), getRoundsListController)
export default roundRoutes
