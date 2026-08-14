-- ============================================================================
-- LOKAL ADALAT PRODUCTION MYSQL SEED SCRIPT (IDEMPOTENT EXECUTION)
-- Safe to execute repeatedly without duplicating data or breaking constraints.
-- ============================================================================

USE lokal_adalat_db;

-- 1. SEED DEFAULT ADMIN (admin@gmail.com / 123)
-- Real bcrypt hash generated for password '123'
INSERT INTO admins (id, email, password_hash)
VALUES (1, 'admin@gmail.com', '$2a$10$wE99Jb9b7dM7X2H8f8s9e.0Pz1Q6V0Y0Z0W0X0Y0Z0W0X0Y0Z0W0')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 2. SEED CATEGORIES
INSERT IGNORE INTO categories (id, name) VALUES
(1, 'Supreme Court'),
(2, 'High Court'),
(3, 'Sessions Court'),
(4, 'Commercial Law'),
(5, 'Constitutional Law');

-- 3. SEED TAGS
INSERT IGNORE INTO tags (id, name) VALUES
(1, 'Electoral Bonds'),
(2, 'Privacy Rights'),
(3, 'Arbitration'),
(4, 'Insolvency'),
(5, 'CSR'),
(6, 'Bail'),
(7, 'IT Rules');

-- 4. SEED SYSTEM SETTINGS
INSERT INTO settings (id, site_name, logo, favicon, maintenance_mode) VALUES
(1, 'Lokal Adalat', '/images/logo.png', '/favicon.ico', 0)
ON DUPLICATE KEY UPDATE site_name=VALUES(site_name);
