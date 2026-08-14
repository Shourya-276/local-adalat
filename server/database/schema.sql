-- ============================================================================
-- LOKAL ADALAT PRODUCTION MYSQL SCHEMA (AWS RDS & LOCAL MYSQL COMPATIBLE)
-- Database: lokal_adalat_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS lokal_adalat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lokal_adalat_db;

-- 1. ADMINISTRATORS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  INDEX idx_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TAGS TABLE
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  body LONGTEXT,
  author VARCHAR(255) DEFAULT 'Editorial Desk',
  category_id INT NULL,
  court VARCHAR(100) NULL,
  target_section VARCHAR(100) DEFAULT 'articles-to-read-sec',
  featured_image LONGTEXT,
  read_time VARCHAR(50) DEFAULT '5 min read',
  publish_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  is_featured TINYINT(1) DEFAULT 0,
  publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_articles_slug (slug),
  INDEX idx_articles_status (publish_status),
  INDEX idx_articles_category (category_id),
  INDEX idx_articles_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. ARTICLE TAGS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS article_tags (
  article_id VARCHAR(64) NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url LONGTEXT NOT NULL,
  thumbnail LONGTEXT NOT NULL,
  duration VARCHAR(50) DEFAULT '1 min 48 sec',
  category_id INT NULL,
  court VARCHAR(100) DEFAULT 'SUPREME COURT',
  publish_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  is_featured_reel TINYINT(1) DEFAULT 1,
  full_story_paragraphs LONGTEXT,
  published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_videos_status (publish_status),
  INDEX idx_videos_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. LATEST NEWS TABLE
CREATE TABLE IF NOT EXISTS latest_news (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  position INT DEFAULT 0,
  court VARCHAR(100) DEFAULT 'HIGH COURT',
  read_time VARCHAR(50) DEFAULT '4 min read',
  image LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. TOP STORIES TABLE
CREATE TABLE IF NOT EXISTS top_stories (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image VARCHAR(500),
  court VARCHAR(100) DEFAULT 'SUPREME COURT',
  read_time VARCHAR(50) DEFAULT '6 min read',
  is_hero TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. MEDIA ASSETS TABLE
CREATE TABLE IF NOT EXISTS media (
  id VARCHAR(64) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INT,
  storage_path VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  admin_id INT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(64),
  status VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) DEFAULT '127.0.0.1',
  user_agent VARCHAR(500),
  details TEXT,
  session_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_name VARCHAR(255) DEFAULT 'Lokal Adalat',
  logo VARCHAR(255),
  favicon VARCHAR(255),
  footer TEXT,
  maintenance_mode TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
