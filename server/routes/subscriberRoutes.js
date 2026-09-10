/**
 * @file subscriberRoutes.js
 * @description Express routes for Newsletter Subscriber Management & MySQL persistence.
 */

import express from 'express';
import { executeQuery } from '../config/database.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validate Email Helper
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @route POST /api/subscribers
 * @desc Public endpoint to subscribe to newsletter
 */
router.post('/', async (req, res, next) => {
  try {
    const { email, source } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSource = (source || 'Website Form').trim();

    // Check if subscriber already exists
    try {
      const existing = await executeQuery('SELECT * FROM subscribers WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
      if (existing && existing.length > 0) {
        return res.json({
          success: true,
          message: 'You are already subscribed to Lokal Adalat!',
          isExisting: true,
          data: existing[0]
        });
      }
    } catch (dbCheckErr) {
      // Ignore if table doesn't exist yet, query insert will fail gracefully or retry
    }

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      await executeQuery(
        'INSERT INTO subscribers (id, email, source, created_at) VALUES (?, ?, ?, NOW())',
        [subId, cleanEmail, cleanSource]
      );
    } catch (dbInsertErr) {
      // If table missing, create table and retry
      if (dbInsertErr.code === 'ER_NO_SUCH_TABLE') {
        await executeQuery(`
          CREATE TABLE IF NOT EXISTS subscribers (
            id VARCHAR(64) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            source VARCHAR(100) DEFAULT 'Website Form',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_subscribers_email (email),
            INDEX idx_subscribers_created (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await executeQuery(
          'INSERT INTO subscribers (id, email, source, created_at) VALUES (?, ?, ?, NOW())',
          [subId, cleanEmail, cleanSource]
        );
      } else {
        throw dbInsertErr;
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! Daily legal briefings will be sent to your inbox.',
      data: {
        id: subId,
        email: cleanEmail,
        source: cleanSource,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/subscribers
 * @desc Get all newsletter subscribers (Admin endpoint)
 */
router.get('/', async (req, res, next) => {
  try {
    try {
      const subscribers = await executeQuery('SELECT * FROM subscribers ORDER BY created_at DESC');
      return res.json({
        success: true,
        data: subscribers || []
      });
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.json({ success: true, data: [] });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @route DELETE /api/subscribers/:id
 * @desc Delete subscriber by ID (Admin endpoint)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM subscribers WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Subscriber removed successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
