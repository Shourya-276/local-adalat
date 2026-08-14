/**
 * @file newsController.js
 * @description Controllers for Top Stories and Latest News.
 */

import { NewsRepository } from '../repositories/newsRepository.js';

export class NewsController {
  static async getNews(req, res) {
    try {
      const topStories = await NewsRepository.getTopStories();
      const latestNews = await NewsRepository.getLatestNews();
      return res.json({ success: true, topStories, latestNews });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}
