/**
 * @file settingsRepository.js
 * @description Parameterized SQL repository for System Settings.
 */

import { executeQuery } from '../config/database.js';

export class SettingsRepository {
  static async getSettings() {
    const sql = 'SELECT * FROM settings WHERE id = 1 LIMIT 1';
    const rows = await executeQuery(sql);
    return rows && rows.length ? rows[0] : { id: 1, site_name: 'Lokal Adalat', maintenance_mode: 0 };
  }

  static async updateSettings(settingsData) {
    const { site_name, logo, favicon, footer, maintenance_mode } = settingsData;
    const sql = `
      INSERT INTO settings (id, site_name, logo, favicon, footer, maintenance_mode)
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE site_name=?, logo=?, favicon=?, footer=?, maintenance_mode=?
    `;
    return await executeQuery(sql, [site_name, logo, favicon, footer, maintenance_mode ? 1 : 0, site_name, logo, favicon, footer, maintenance_mode ? 1 : 0]);
  }
}
