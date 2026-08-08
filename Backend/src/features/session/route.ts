import { Hono } from 'hono';
import { getSessionController } from './controller.js';
import authenticate from '../../middleware/authenticate.js';

const sessionRoutes = new Hono()
sessionRoutes.get("/me", authenticate, getSessionController)

export default sessionRoutes