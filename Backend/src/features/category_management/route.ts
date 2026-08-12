import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
    addCategoryController, editCategoryController, getCategoryByIdController,
    getCategoryListController, saveCategoryFieldsController
} from './controller.js';
import {
    validateAddCategoryInput, validateEditCategoryInput, validateGetCategoryByIdInput,
    validateSaveCategoryFieldsInput
} from './middleware.js';

const categoryRoutes = new Hono()
categoryRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddCategoryInput, addCategoryController)
    .get("/", authenticate, requireRole(Role.ADMIN), getCategoryListController)
    .get("/:id", authenticate, requireRole(Role.ADMIN), validateGetCategoryByIdInput, getCategoryByIdController)
    .patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditCategoryInput, editCategoryController)
    .put("/:id/fields", authenticate, requireRole(Role.ADMIN), validateSaveCategoryFieldsInput, saveCategoryFieldsController)

export default categoryRoutes
