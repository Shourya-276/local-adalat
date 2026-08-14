/**
 * @file authMiddleware.js
 * @description Express middleware verifying JWT session token headers.
 */

import { AuthService } from '../services/authService.js';

export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }

  req.user = decoded;
  next();
}
