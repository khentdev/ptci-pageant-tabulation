import { Hono } from 'hono';

import { Role } from '../../../generated/prisma/enums.js';
import authenticate from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { getAuditLogsController } from './controller.js';

const auditTrailRoutes = new Hono()
auditTrailRoutes.
    get("/", authenticate, requireRole(Role.ADMIN, Role.CHAIRMAN), getAuditLogsController)
export default auditTrailRoutes
