/**
 * @file mediaController.js
 * @description Controllers for Media upload and gallery.
 */

import { MediaRepository } from '../repositories/mediaRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';

export class MediaController {
  static async getAllMedia(req, res) {
    try {
      const media = await MediaRepository.getAll();
      return res.json({ success: true, data: media });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async uploadMediaFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No media file provided' });
      }

      const file = req.file;
      const mediaData = {
        id: `med_${Date.now()}`,
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        storage_path: `/uploads/${file.filename}`
      };

      await MediaRepository.create(mediaData);

      await AuditRepository.logEvent(
        `log_${Date.now()}`,
        'MEDIA_UPLOAD',
        'MEDIA',
        mediaData.id,
        'SUCCESS',
        `Uploaded file: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`
      );

      return res.status(201).json({ success: true, data: mediaData });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async deleteMedia(req, res) {
    try {
      const id = req.params.id;
      await MediaRepository.delete(id);
      return res.json({ success: true, message: 'Media deleted' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}
