/**
 * @file authRoutes.js
 * @description Express router for authentication endpoints.
 */

import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/session', requireAdminAuth, AuthController.checkSession);

export default router;
