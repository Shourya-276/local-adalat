/**
 * @file mediaRoutes.js
 * @description Express router for Media upload & management.
 */

import express from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { uploadMedia } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', MediaController.getAllMedia);
router.post('/upload', requireAdminAuth, uploadMedia.single('file'), MediaController.uploadMediaFile);
router.delete('/:id', requireAdminAuth, MediaController.deleteMedia);

export default router;
