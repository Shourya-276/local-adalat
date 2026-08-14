/**
 * @file articleRepository.js
 * @description Parameterized SQL repository for Articles table.
 */

import { executeQuery } from '../config/database.js';

/**
 * Converts various date formats to MySQL DATETIME string (YYYY-MM-DD HH:MM:SS).
 * @param {string|Date} dateInput
 * @returns {string}
 */
function toMySQLDatetime(dateInput) {
  if (!dateInput) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

export class ArticleRepository {
  static async getAll() {
    const sql = 'SELECT * FROM articles ORDER BY created_at DESC';
    const rows = await executeQuery(sql);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      body: r.body,
      paragraphs: r.body ? (r.body.startsWith('[') ? JSON.parse(r.body) : r.body.split('\n\n')) : [],
      author: r.author,
      court: r.court,
      targetSection: r.target_section,
      featured_image: r.featured_image,
      image: r.featured_image,
      readTime: r.read_time,
      status: r.publish_status,
      isFeatured: r.is_featured === 1,
      publishDate: r.publish_date,
      seoTitle: r.seo_title,
      seoDescription: r.seo_description,
      seoKeywords: r.seo_keywords
    }));
  }

  static async getById(id) {
    const sql = 'SELECT * FROM articles WHERE id = ? LIMIT 1';
    const rows = await executeQuery(sql, [id]);
    if (!rows || !rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      body: r.body,
      paragraphs: r.body ? (r.body.startsWith('[') ? JSON.parse(r.body) : r.body.split('\n\n')) : [],
      author: r.author,
      court: r.court,
      targetSection: r.target_section,
      featured_image: r.featured_image,
      image: r.featured_image,
      readTime: r.read_time,
      status: r.publish_status,
      isFeatured: r.is_featured === 1,
      publishDate: r.publish_date,
      seoTitle: r.seo_title,
      seoDescription: r.seo_description,
      seoKeywords: r.seo_keywords
    };
  }

  static async create(articleData) {
    const {
      id, title, slug, target_section, targetSection, excerpt, body, paragraphs, author, court, featured_image, image, read_time, readTime, publish_status, status, is_featured, publish_date, publishDate, seo_title, seoTitle, seo_description, seoDescription, seo_keywords, seoKeywords
    } = articleData;

    const targetSecVal = target_section || targetSection || 'articles-to-read-sec';
    const courtVal = court !== undefined ? court : null;
    const imgVal = featured_image || image || '';
    const readVal = read_time || readTime || '5 min read';
    const statusVal = publish_status || status || 'published';
    const bodyVal = body || (Array.isArray(paragraphs) ? JSON.stringify(paragraphs) : (paragraphs || excerpt || ''));
    const dateVal = toMySQLDatetime(publish_date || publishDate);
    const seoT = seo_title || seoTitle || '';
    const seoD = seo_description || seoDescription || '';
    const seoK = seo_keywords || seoKeywords || '';

    const sql = `
      INSERT INTO articles (id, title, slug, target_section, excerpt, body, author, court, featured_image, read_time, publish_status, is_featured, publish_date, seo_title, seo_description, seo_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await executeQuery(sql, [
      id, title, slug || '', targetSecVal, excerpt || '', bodyVal, author || 'Editorial Desk', courtVal, imgVal, readVal, statusVal, is_featured ? 1 : 0, dateVal, seoT, seoD, seoK
    ]);
  }

  static async update(id, articleData) {
    const {
      title, slug, target_section, targetSection, excerpt, body, paragraphs, author, court, featured_image, image, read_time, readTime, publish_status, status, is_featured, publish_date, publishDate, seo_title, seoTitle, seo_description, seoDescription, seo_keywords, seoKeywords
    } = articleData;

    const targetSecVal = target_section || targetSection || 'articles-to-read-sec';
    const courtVal = court !== undefined ? court : null;
    const imgVal = featured_image || image || '';
    const readVal = read_time || readTime || '5 min read';
    const statusVal = publish_status || status || 'published';
    const bodyVal = body || (Array.isArray(paragraphs) ? JSON.stringify(paragraphs) : (paragraphs || excerpt || ''));
    const dateVal = toMySQLDatetime(publish_date || publishDate);
    const seoT = seo_title || seoTitle || '';
    const seoD = seo_description || seoDescription || '';
    const seoK = seo_keywords || seoKeywords || '';

    const sql = `
      UPDATE articles
      SET title = ?, slug = ?, target_section = ?, excerpt = ?, body = ?, author = ?, court = ?, featured_image = ?, read_time = ?, publish_status = ?, is_featured = ?, publish_date = ?, seo_title = ?, seo_description = ?, seo_keywords = ?
      WHERE id = ?
    `;

    return await executeQuery(sql, [
      title, slug || '', targetSecVal, excerpt || '', bodyVal, author || 'Editorial Desk', courtVal, imgVal, readVal, statusVal, is_featured ? 1 : 0, dateVal, seoT, seoD, seoK, id
    ]);
  }

  static async delete(id) {
    const sql = 'DELETE FROM articles WHERE id = ?';
    return await executeQuery(sql, [id]);
  }
}
