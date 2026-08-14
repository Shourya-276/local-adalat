/**
 * @file articleController.js
 * @description Controllers for Articles CRUD API.
 */

import { ArticleRepository } from '../repositories/articleRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';

export class ArticleController {
  static async getAllArticles(req, res) {
    try {
      const articles = await ArticleRepository.getAll();
      return res.json({ success: true, data: articles });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async getArticleById(req, res) {
    try {
      const article = await ArticleRepository.getById(req.params.id);
      if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
      return res.json({ success: true, data: article });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async createArticle(req, res) {
    try {
      const articleData = req.body;
      if (!articleData.id) articleData.id = `art_${Date.now()}`;
      await ArticleRepository.create(articleData);

      await AuditRepository.logEvent(
        `log_${Date.now()}`,
        'ARTICLE_CREATE',
        'ARTICLES',
        articleData.id,
        'SUCCESS',
        `Created article: "${articleData.title}"`
      );

      return res.status(201).json({ success: true, data: articleData });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async updateArticle(req, res) {
    try {
      const id = req.params.id;
      await ArticleRepository.update(id, req.body);

      await AuditRepository.logEvent(
        `log_${Date.now()}`,
        'ARTICLE_UPDATE',
        'ARTICLES',
        id,
        'SUCCESS',
        `Updated article ID: ${id}`
      );

      return res.json({ success: true, data: { id, ...req.body } });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async deleteArticle(req, res) {
    try {
      const id = req.params.id;
      await ArticleRepository.delete(id);

      await AuditRepository.logEvent(
        `log_${Date.now()}`,
        'ARTICLE_DELETE',
        'ARTICLES',
        id,
        'SUCCESS',
        `Deleted article ID: ${id}`
      );

      return res.json({ success: true, message: 'Article deleted successfully' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async duplicateArticle(req, res) {
    try {
      const existing = await ArticleRepository.getById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Article not found' });

      const newId = `art_${Date.now()}`;
      const duplicateData = {
        ...existing,
        id: newId,
        title: `${existing.title} (Copy)`,
        slug: `${existing.slug}-copy`,
        publish_status: 'draft',
        created_at: new Date().toISOString()
      };

      await ArticleRepository.create(duplicateData);
      return res.status(201).json({ success: true, data: duplicateData });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}
