/**
 * @file settingsRoutes.js
 * @description Express router for System Settings.
 */

import express from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', SettingsController.getSettings);
router.put('/', requireAdminAuth, SettingsController.updateSettings);

export default router;
