import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { advanceRoundController, getJudgeSubmissionsController, getRoundResultsByIdController } from './controller.js';
import {
    validateAdvanceRound, validateGetJudgeSubmissions, validateGetRoundResultsById
} from './middleware.js';

const liveEventRoutes = new Hono()
liveEventRoutes.get("/round-results/:id", authenticate, requireRole(Role.ADMIN), validateGetJudgeSubmissions, getJudgeSubmissionsController)
    .get("/round-results/:id/advancement", authenticate, requireRole(Role.ADMIN), validateGetRoundResultsById, getRoundResultsByIdController)
    .post("/round-results/:id/advancement", authenticate, requireRole(Role.ADMIN), validateAdvanceRound, advanceRoundController)
export default liveEventRoutes
