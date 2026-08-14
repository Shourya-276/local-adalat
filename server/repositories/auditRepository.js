/**
 * @file auditRepository.js
 * @description Parameterized SQL repository for Security Audit Logs.
 */

import { executeQuery } from '../config/database.js';

export class AuditRepository {
  static async getAll() {
    const sql = 'SELECT * FROM audit_logs ORDER BY created_at DESC';
    return await executeQuery(sql);
  }

  static async logEvent(id, action, resource, resource_id, status, details, session_id) {
    const sql = `
      INSERT INTO audit_logs (id, action, resource, resource_id, status, details, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return await executeQuery(sql, [id, action, resource, resource_id || null, status, details || '', session_id || null]);
  }

  static async clearAll() {
    const sql = 'DELETE FROM audit_logs';
    return await executeQuery(sql);
  }
}
