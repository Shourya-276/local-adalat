/**
 * @file videoRepository.js
 * @description Parameterized SQL repository for Videos & Reels table.
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

export class VideoRepository {
  static async getAll() {
    const sql = 'SELECT * FROM videos ORDER BY created_at DESC';
    const rows = await executeQuery(sql);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      excerpt: r.description,
      videoUrl: r.video_url,
      posterImage: r.thumbnail,
      image: r.thumbnail,
      duration: r.duration,
      court: r.court,
      status: r.publish_status,
      isFeaturedReel: r.is_featured_reel === 1,
      fullStoryParagraphs: r.full_story_paragraphs ? (r.full_story_paragraphs.startsWith('[') ? JSON.parse(r.full_story_paragraphs) : [r.full_story_paragraphs]) : [],
      publishedDate: r.published_date
    }));
  }

  static async getById(id) {
    const sql = 'SELECT * FROM videos WHERE id = ? LIMIT 1';
    const rows = await executeQuery(sql, [id]);
    if (!rows || !rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      excerpt: r.description,
      videoUrl: r.video_url,
      posterImage: r.thumbnail,
      image: r.thumbnail,
      duration: r.duration,
      court: r.court,
      status: r.publish_status,
      isFeaturedReel: r.is_featured_reel === 1,
      fullStoryParagraphs: r.full_story_paragraphs ? (r.full_story_paragraphs.startsWith('[') ? JSON.parse(r.full_story_paragraphs) : [r.full_story_paragraphs]) : [],
      publishedDate: r.published_date
    };
  }

  static async create(videoData) {
    const {
      id, title, description, excerpt, video_url, videoUrl, thumbnail, posterImage, image, duration, court, publish_status, status, is_featured_reel, full_story_paragraphs, fullStoryParagraphs, published_date, publishedDate
    } = videoData;

    const descVal = description || excerpt || '';
    const vidUrlVal = video_url || videoUrl || '';
    const thumbVal = thumbnail || posterImage || image || '';
    const durVal = duration || '1 min 48 sec';
    const courtVal = court || 'SUPREME COURT';
    const statusVal = publish_status || status || 'published';
    const paragraphsRaw = Array.isArray(full_story_paragraphs || fullStoryParagraphs) 
      ? JSON.stringify(full_story_paragraphs || fullStoryParagraphs) 
      : (full_story_paragraphs || fullStoryParagraphs || '');
    const dateVal = toMySQLDatetime(published_date || publishedDate);

    const sql = `
      INSERT INTO videos (id, title, description, video_url, thumbnail, duration, court, publish_status, is_featured_reel, full_story_paragraphs, published_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await executeQuery(sql, [
      id, title, descVal, vidUrlVal, thumbVal, durVal, courtVal, statusVal, is_featured_reel ? 1 : 0, paragraphsRaw, dateVal
    ]);
  }

  static async update(id, videoData) {
    const {
      title, description, excerpt, video_url, videoUrl, thumbnail, posterImage, image, duration, court, publish_status, status, is_featured_reel, full_story_paragraphs, fullStoryParagraphs, published_date, publishedDate
    } = videoData;

    const descVal = description || excerpt || '';
    const vidUrlVal = video_url || videoUrl || '';
    const thumbVal = thumbnail || posterImage || image || '';
    const durVal = duration || '1 min 48 sec';
    const courtVal = court || 'SUPREME COURT';
    const statusVal = publish_status || status || 'published';
    const paragraphsRaw = Array.isArray(full_story_paragraphs || fullStoryParagraphs) 
      ? JSON.stringify(full_story_paragraphs || fullStoryParagraphs) 
      : (full_story_paragraphs || fullStoryParagraphs || '');
    const dateVal = toMySQLDatetime(published_date || publishedDate);

    const sql = `
      UPDATE videos
      SET title = ?, description = ?, video_url = ?, thumbnail = ?, duration = ?, court = ?, publish_status = ?, is_featured_reel = ?, full_story_paragraphs = ?, published_date = ?
      WHERE id = ?
    `;

    return await executeQuery(sql, [
      title, descVal, vidUrlVal, thumbVal, durVal, courtVal, statusVal, is_featured_reel ? 1 : 0, paragraphsRaw, dateVal, id
    ]);
  }

  static async delete(id) {
    const sql = 'DELETE FROM videos WHERE id = ?';
    return await executeQuery(sql, [id]);
  }
}
