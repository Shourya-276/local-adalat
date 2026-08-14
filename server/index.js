/**
 * @file index.js
 * @description Hardened Express Server for Lokal Adalat CMS & Cyber Security Engine.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabaseConnection, executeQuery } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Enhanced Production Health Check Endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    let dbStatus = 'CONNECTED';
    try {
      await executeQuery('SELECT 1');
    } catch (e) {
      dbStatus = 'DISCONNECTED';
    }

    return res.json({
      status: dbStatus === 'CONNECTED' ? 'UP' : 'DEGRADED',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
async function startServer() {
  try {
    await initDatabaseConnection();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Hardened Express Backend running on Port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error(`[Server Startup Failed] ${err.message}`);
    process.exit(1);
  }
}

startServer();
