import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { advanceRoundController, declareWinnersController, getDeclaredWinnersController, getJudgeSubmissionsController, getRoundResultsByIdController } from './controller.js';
import {
    validateAdvanceRound, validateDeclareWinners, validateGetDeclaredWinners, validateGetJudgeSubmissions, validateGetRoundResultsById
} from './middleware.js';

const liveEventRoutes = new Hono()
liveEventRoutes.get("/round-results/:id", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), validateGetJudgeSubmissions, getJudgeSubmissionsController)
    .get("/round-results/:id/advancement", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), validateGetRoundResultsById, getRoundResultsByIdController)
    .get("/round-results/:id/declared-winners", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), validateGetDeclaredWinners, getDeclaredWinnersController)
    .post("/round-results/:id/advancement", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), validateAdvanceRound, advanceRoundController)
    .post("/round-results/:id/declare-winners", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), validateDeclareWinners, declareWinnersController)
export default liveEventRoutes
