import { Hono } from "hono";
import {
    addJudgeController,
    deleteJudgeController,
    editJudgeController,
    getJudgeListController,
    resetJudgePasswordController,
} from "./controller.js";
import {
    validateAddJudgeInput,
    validateDeleteJudgeInput,
    validateEditJudgeInput,
    validateResetJudgePasswordInput,
} from "./middleware.js";
import authenticate from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { Role } from "../../../generated/prisma/enums.js";

export const judgeRoutes = new Hono()
judgeRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddJudgeInput, addJudgeController)
    .get("/", authenticate, requireRole(Role.ADMIN), getJudgeListController)
    .patch("/:id/password", authenticate, requireRole(Role.ADMIN), validateResetJudgePasswordInput, resetJudgePasswordController)
    .patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditJudgeInput, editJudgeController)
    .delete("/:id", authenticate, requireRole(Role.ADMIN), validateDeleteJudgeInput, deleteJudgeController)
