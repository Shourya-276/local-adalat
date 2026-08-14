/**
 * @file authController.js
 * @description Request handlers for Admin Authentication endpoints.
 */

import { AuthService } from '../services/authService.js';

export class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const result = await AuthService.authenticate(email, password, ip);
      if (!result.success) {
        return res.status(result.status || 401).json(result);
      }

      return res.json(result);
    } catch (err) {
      console.error('[Auth Error]', err);
      return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
    }
  }

  static checkSession(req, res) {
    return res.json({ success: true, valid: true, user: req.user });
  }
}
