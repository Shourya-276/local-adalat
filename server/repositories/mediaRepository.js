/**
 * @file mediaRepository.js
 * @description Parameterized SQL repository for Media Assets table.
 */

import { executeQuery } from '../config/database.js';

export class MediaRepository {
  static async getAll() {
    const sql = 'SELECT * FROM media ORDER BY created_at DESC';
    return await executeQuery(sql);
  }

  static async create(mediaData) {
    const { id, filename, original_name, mime_type, file_size, storage_path } = mediaData;
    const sql = `
      INSERT INTO media (id, filename, original_name, mime_type, file_size, storage_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return await executeQuery(sql, [id, filename, original_name, mime_type, file_size, storage_path]);
  }

  static async delete(id) {
    const sql = 'DELETE FROM media WHERE id = ?';
    return await executeQuery(sql, [id]);
  }
}
