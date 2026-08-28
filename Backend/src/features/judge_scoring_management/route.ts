import { Hono } from "hono";
import { Role } from "../../../generated/prisma/enums.js";
import authenticate from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import {
    getCategoryScoringFieldsController,
    getJudgeRoundsController,
    getMyCategoryScoresController,
    getRoundContestantsController,
    submitCategoryScoresController,
} from "./controller.js";
import {
    validateGetCategoryScoringFieldsInput,
    validateGetMyCategoryScoresInput,
    validateGetRoundContestantsInput,
    validateSubmitCategoryScoresInput,
} from "./middleware.js";

const judgeScoringRoutes = new Hono()
judgeScoringRoutes
    .get("/rounds", authenticate, requireRole(Role.JUDGE), getJudgeRoundsController)
    .get("/rounds/:id/contestants", authenticate, requireRole(Role.JUDGE), validateGetRoundContestantsInput, getRoundContestantsController)
    .get("/categories/:id/fields", authenticate, requireRole(Role.JUDGE), validateGetCategoryScoringFieldsInput, getCategoryScoringFieldsController)
    .get("/categories/:id/scores", authenticate, requireRole(Role.JUDGE), validateGetMyCategoryScoresInput, getMyCategoryScoresController)
    .post("/categories/:id/scores", authenticate, requireRole(Role.JUDGE), validateSubmitCategoryScoresInput, submitCategoryScoresController)

export default judgeScoringRoutes
