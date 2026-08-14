/**
 * @file adminRepository.js
 * @description Parameterized SQL query repository for Administrators table.
 */

import { executeQuery } from '../config/database.js';

export class AdminRepository {
  static async findByEmail(email) {
    const sql = 'SELECT * FROM admins WHERE email = ? LIMIT 1';
    const rows = await executeQuery(sql, [email]);
    return rows && rows.length ? rows[0] : null;
  }

  static async updateLastLogin(id) {
    const sql = 'UPDATE admins SET last_login = NOW() WHERE id = ?';
    return await executeQuery(sql, [id]);
  }
}
