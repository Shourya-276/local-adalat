/**
 * @file newsRoutes.js
 * @description Express router for Top Stories & Latest News endpoints.
 */

import express from 'express';
import { NewsController } from '../controllers/newsController.js';

const router = express.Router();

router.get('/', NewsController.getNews);

export default router;
