import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { addCategoryController, editCategoryController, getCategoryByIdController } from './controller.js';
import { validateAddCategoryInput, validateEditCategoryInput, validateGetCategoryByIdInput } from './middleware.js';

const categoryRoutes = new Hono()
categoryRoutes.post("/", authenticate, requireRole(Role.ADMIN), validateAddCategoryInput, addCategoryController)
categoryRoutes.get("/:id", authenticate, requireRole(Role.ADMIN), validateGetCategoryByIdInput, getCategoryByIdController)
categoryRoutes.patch("/:id", authenticate, requireRole(Role.ADMIN), validateEditCategoryInput, editCategoryController)
export default categoryRoutes
