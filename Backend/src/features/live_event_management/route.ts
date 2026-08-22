import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { advanceRoundController, declareWinnersController, getJudgeSubmissionsController, getRoundResultsByIdController } from './controller.js';
import {
    validateAdvanceRound, validateDeclareWinners, validateGetJudgeSubmissions, validateGetRoundResultsById
} from './middleware.js';

const liveEventRoutes = new Hono()
liveEventRoutes.get("/round-results/:id", authenticate, requireRole(Role.ADMIN), validateGetJudgeSubmissions, getJudgeSubmissionsController)
    .get("/round-results/:id/advancement", authenticate, requireRole(Role.ADMIN), validateGetRoundResultsById, getRoundResultsByIdController)
    .post("/round-results/:id/advancement", authenticate, requireRole(Role.ADMIN), validateAdvanceRound, advanceRoundController)
    .post("/round-results/:id/declare-winners", authenticate, requireRole(Role.ADMIN), validateDeclareWinners, declareWinnersController)
export default liveEventRoutes
