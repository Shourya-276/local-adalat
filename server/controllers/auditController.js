/**
 * @file auditController.js
 * @description Controllers for Security Audit Logs API.
 */

import { AuditRepository } from '../repositories/auditRepository.js';

export class AuditController {
  static async getLogs(req, res) {
    try {
      const logs = await AuditRepository.getAll();
      return res.json({ success: true, data: logs });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  static async clearLogs(req, res) {
    try {
      await AuditRepository.clearAll();
      return res.json({ success: true, message: 'Audit logs cleared' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}
