/**
 * @file videoRoutes.js
 * @description Express router for Videos & Reels endpoints.
 */

import express from 'express';
import { VideoController } from '../controllers/videoController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', VideoController.getAllVideos);
router.post('/', requireAdminAuth, VideoController.createVideo);
router.put('/:id', requireAdminAuth, VideoController.updateVideo);
router.delete('/:id', requireAdminAuth, VideoController.deleteVideo);

export default router;
