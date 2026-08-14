/**
 * @file database.js
 * @description Hardened MySQL connection pool using mysql2/promise.
 * Strictly validates environment variables and removes mock in-memory fallback.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

function validateEnvironmentVariables() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`[CRITICAL CONFIG ERROR] Missing required environment variables: ${missing.join(', ')}. Server startup aborted.`);
  }
}

validateEnvironmentVariables();

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

import fs from 'fs';

let pool = null;

async function autoInitSchemaAndSeed(connection) {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');

    await connection.query(schemaSql);
    try {
      await connection.query('ALTER TABLE videos MODIFY video_url LONGTEXT, MODIFY thumbnail LONGTEXT');
      await connection.query('ALTER TABLE articles MODIFY featured_image LONGTEXT');
      await connection.query('ALTER TABLE latest_news MODIFY image LONGTEXT');
      await connection.query("ALTER TABLE articles ADD COLUMN target_section VARCHAR(100) DEFAULT 'articles-to-read-sec'");
    } catch (alterErr) {
      // Ignore if columns already modified or existing
    }
    await connection.query(seedSql);
    console.log('[MySQL Database] Auto-initialized schema and seed dataset successfully.');
  } catch (err) {
    console.warn('[MySQL Schema Auto-Init Notice]', err.message);
  }
}

export async function initDatabaseConnection() {
  try {
    pool = mysql.createPool({ ...dbConfig, multipleStatements: true });
    const connection = await pool.getConnection();
    console.log(`[MySQL Database] Connected to MySQL pool at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    await autoInitSchemaAndSeed(connection);
    
    connection.release();
    return true;
  } catch (err) {
    console.error(`[MySQL Database Error] Failed to connect to MySQL (${err.message}).`);
    throw err;
  }
}

/**
 * Executes a parameterized SQL query using the connection pool.
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
export async function executeQuery(sql, params = []) {
  if (!pool) {
    throw new Error('[Database Error] MySQL connection pool is not initialized.');
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
}

export function getPool() {
  return pool;
}
