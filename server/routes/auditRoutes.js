/**
 * @file auditRoutes.js
 * @description Express router for Security Audit Logs.
 */

import express from 'express';
import { AuditController } from '../controllers/auditController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAdminAuth, AuditController.getLogs);
router.delete('/', requireAdminAuth, AuditController.clearLogs);

export default router;
