import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
    addCategoryController, deleteCategoryController, editCategoryController, getCategoryByIdController,
    getCategoryFieldsController, getCategoryListController, saveCategoryFieldsController
} from './controller.js';
import {
    validateAddCategoryInput, validateDeleteCategoryInput, validateEditCategoryInput, validateGetCategoryByIdInput,
    validateGetCategoryFieldsInput, validateSaveCategoryFieldsInput
} from './middleware.js';

const categoryRoutes = new Hono()
categoryRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddCategoryInput, addCategoryController)
    .get("/", authenticate, requireRole(Role.ADMIN), getCategoryListController)
    .get("/:id/fields", authenticate, requireRole(Role.ADMIN), validateGetCategoryFieldsInput, getCategoryFieldsController)
    .put("/:id/fields", authenticate, requireRole(Role.ADMIN), validateSaveCategoryFieldsInput, saveCategoryFieldsController)
    .get("/:id", authenticate, requireRole(Role.ADMIN), validateGetCategoryByIdInput, getCategoryByIdController)
    .patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditCategoryInput, editCategoryController)
    .delete("/:id", authenticate, requireRole(Role.ADMIN), validateDeleteCategoryInput, deleteCategoryController)

export default categoryRoutes
