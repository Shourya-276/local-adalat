/**
 * @file articleRoutes.js
 * @description Express router for Articles endpoints.
 */

import express from 'express';
import { ArticleController } from '../controllers/articleController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', ArticleController.getAllArticles);
router.get('/:id', ArticleController.getArticleById);
router.post('/', requireAdminAuth, ArticleController.createArticle);
router.put('/:id', requireAdminAuth, ArticleController.updateArticle);
router.delete('/:id', requireAdminAuth, ArticleController.deleteArticle);
router.post('/:id/duplicate', requireAdminAuth, ArticleController.duplicateArticle);

export default router;
