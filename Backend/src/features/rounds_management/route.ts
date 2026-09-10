import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { addRoundController, deleteRoundPhaseController, editRoundController, getRoundByIdController, getRoundsListController } from './controller.js';
import { validateAddRoundInput, validateEditRoundInput, validateGetRoundByIdInput, validateDeleteRoundPhaseInput } from './middleware.js';

const roundRoutes = new Hono()
roundRoutes.
    // Read-only — Chairman's Live Event sidebar (LiveRoundSideBar) also
    // needs the round list/detail for navigation, even though Chairman has
    // no access to round management (create/edit/delete stay Admin-only).
    get("/", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), getRoundsListController).
    get("/:id", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), validateGetRoundByIdInput, getRoundByIdController).
    patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditRoundInput, editRoundController).
    post("/", authenticate, requireRole(Role.ADMIN), validateAddRoundInput, addRoundController).
    delete("/:id", authenticate, requireRole(Role.ADMIN), validateDeleteRoundPhaseInput, deleteRoundPhaseController)
export default roundRoutes
