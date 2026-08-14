/**
 * @file videoController.js
 * @description Controllers for Videos & Reels CRUD API.
 */

import { VideoRepository } from '../repositories/videoRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';

export class VideoController {
  static async getAllVideos(req, res) {
    try {
      const videos = await VideoRepository.getAll();
      return res.json({ success: true, data: videos });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async createVideo(req, res) {
    try {
      const videoData = req.body;
      if (!videoData.id) videoData.id = `vid_${Date.now()}`;
      await VideoRepository.create(videoData);

      await AuditRepository.logEvent(
        `log_${Date.now()}`,
        'VIDEO_CREATE',
        'VIDEOS',
        videoData.id,
        'SUCCESS',
        `Created video reel: "${videoData.title}"`
      );

      return res.status(201).json({ success: true, data: videoData });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async updateVideo(req, res) {
    try {
      const id = req.params.id;
      await VideoRepository.update(id, req.body);
      return res.json({ success: true, data: { id, ...req.body } });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async deleteVideo(req, res) {
    try {
      const id = req.params.id;
      await VideoRepository.delete(id);
      return res.json({ success: true, message: 'Video deleted' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}
