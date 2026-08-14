/**
 * @file newsRepository.js
 * @description Parameterized SQL repository for Top Stories & Latest News tables.
 */

import { executeQuery } from '../config/database.js';

export class NewsRepository {
  static async getTopStories() {
    const sql = 'SELECT * FROM top_stories ORDER BY is_hero DESC, id ASC';
    return await executeQuery(sql);
  }

  static async getLatestNews() {
    const sql = 'SELECT * FROM latest_news ORDER BY position ASC, id ASC';
    return await executeQuery(sql);
  }
}
