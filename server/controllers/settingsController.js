/**
 * @file settingsController.js
 * @description Controllers for System Settings API.
 */

import { SettingsRepository } from '../repositories/settingsRepository.js';

export class SettingsController {
  static async getSettings(req, res) {
    try {
      const settings = await SettingsRepository.getSettings();
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async updateSettings(req, res) {
    try {
      await SettingsRepository.updateSettings(req.body);
      return res.json({ success: true, data: req.body });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}
