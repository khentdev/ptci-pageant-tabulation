import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { getJudgeSubmissionsController } from './controller.js';
import { validateGetJudgeSubmissions } from './middleware.js';

const liveEventRoutes = new Hono()
liveEventRoutes.get("/round-results/:id", authenticate, requireRole(Role.ADMIN), validateGetJudgeSubmissions, getJudgeSubmissionsController)

export default liveEventRoutes
