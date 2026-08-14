/**
 * @file security.js
 * @description Cyber Security Engine for Lokal Adalat Admin System.
 * Features: Auth verification, rate limiting, crypto tokens, XSS input sanitization, 
 * malicious file upload detection, session timeouts, and security audit logging.
 */

// Configuration Constants
const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: '123'
};

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const DISALLOWED_EXTENSIONS = [
  '.exe', '.php', '.js', '.sh', '.bat', '.cmd', '.html', '.htm',
  '.py', '.pl', '.cgi', '.vbs', '.jar', '.scr', '.pif', '.application'
];

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

let failedLoginCount = 0;
let lockoutUntilTimestamp = 0;
let activeSessionToken = null;
let auditLogsList = [];

/**
 * Escapes special HTML characters to prevent XSS attacks.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes user input string against script injection.
 * @param {string} input 
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  let clean = input.trim();
  // Remove script tags and inline event handlers
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/on\w+="[^"]*"/gi, '');
  clean = clean.replace(/on\w+='[^']*'/gi, '');
  clean = clean.replace(/javascript:[^\s"']+/gi, '');
  return clean;
}

/**
 * Generates a secure random token using the Web Crypto API.
 * @returns {string}
 */
export function generateCryptoToken() {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback if crypto API unavailable
  return 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Records an entry in the Security Audit Log.
 * @param {Object} logParams 
 */
export function logAuditEvent({ event, resource = 'AUTH', status = 'SUCCESS', details = '' }) {
  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    event: sanitizeInput(event),
    resource: sanitizeInput(resource),
    status: status.toUpperCase(),
    details: sanitizeInput(details),
    browser: navigator.userAgent.substring(0, 80),
    sessionId: activeSessionToken ? activeSessionToken.substring(0, 10) + '...' : 'ANONYMOUS'
  };

  auditLogsList.unshift(logEntry);
  if (auditLogsList.length > 500) {
    auditLogsList.pop();
  }

  // Persist logs in LocalStorage
  try {
    localStorage.setItem('lokal_adalat_audit_logs', JSON.stringify(auditLogsList));
  } catch (e) {
    console.warn('Unable to persist audit logs', e);
  }

  return logEntry;
}

/**
 * Retrieves audit logs list from memory or storage.
 * @returns {Array}
 */
export function getAuditLogs() {
  if (!auditLogsList.length) {
    try {
      const stored = localStorage.getItem('lokal_adalat_audit_logs');
      if (stored) {
        auditLogsList = JSON.parse(stored);
      }
    } catch (e) {
      auditLogsList = [];
    }
  }
  return auditLogsList;
}

/**
 * Clears all recorded audit logs.
 */
export function clearAuditLogs() {
  auditLogsList = [];
  try {
    localStorage.removeItem('lokal_adalat_audit_logs');
  } catch (e) {}
  logAuditEvent({ event: 'AUDIT_LOGS_CLEARED', resource: 'SYSTEM', status: 'SUCCESS', details: 'Audit log table reset by administrator' });
}

/**
 * Checks if the authentication module is currently locked out due to brute force attempts.
 * @returns {{ isLocked: boolean, remainingSeconds: number }}
 */
export function checkLockoutStatus() {
  const now = Date.now();
  if (lockoutUntilTimestamp > now) {
    const remainingSeconds = Math.ceil((lockoutUntilTimestamp - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }
  if (lockoutUntilTimestamp !== 0 && lockoutUntilTimestamp <= now) {
    // Reset lockout state after duration expires
    lockoutUntilTimestamp = 0;
    failedLoginCount = 0;
  }
  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * Verifies admin credentials with rate limiting & security logging.
 * @param {string} email 
 * @param {string} password 
 * @returns {{ success: boolean, message: string, token?: string }}
 */
export function authenticateAdmin(email, password) {
  const lockout = checkLockoutStatus();
  if (lockout.isLocked) {
    logAuditEvent({
      event: 'LOGIN_BLOCKED',
      resource: 'AUTH',
      status: 'BLOCKED',
      details: `Attempt blocked. Rate limiter active for ${lockout.remainingSeconds}s`
    });
    return {
      success: false,
      message: `Security Lockout Active! Please wait ${lockout.remainingSeconds} seconds before trying again.`
    };
  }

  const cleanEmail = sanitizeInput(email || '').toLowerCase();
  const cleanPassword = (password || '').trim();

  if (cleanEmail === ADMIN_CREDENTIALS.email && cleanPassword === ADMIN_CREDENTIALS.password) {
    failedLoginCount = 0;
    lockoutUntilTimestamp = 0;
    activeSessionToken = generateCryptoToken();
    const nowTs = Date.now();

    sessionStorage.setItem('lokal_adalat_admin_token', activeSessionToken);
    sessionStorage.setItem('lokal_adalat_last_activity', nowTs.toString());

    logAuditEvent({
      event: 'LOGIN_SUCCESS',
      resource: 'AUTH',
      status: 'SUCCESS',
      details: `Administrator authenticated successfully as ${cleanEmail}`
    });

    return {
      success: true,
      message: 'Authentication successful. Access granted to Admin Dashboard.',
      token: activeSessionToken
    };
  }

  failedLoginCount++;
  if (failedLoginCount >= MAX_FAILED_ATTEMPTS) {
    lockoutUntilTimestamp = Date.now() + LOCKOUT_DURATION_MS;
    logAuditEvent({
      event: 'LOCKOUT_TRIGGERED',
      resource: 'SECURITY',
      status: 'LOCKOUT',
      details: `Brute force threshold reached (${MAX_FAILED_ATTEMPTS} failures). System locked for 30s.`
    });
    return {
      success: false,
      message: `Security Lockout Triggered! 3 failed attempts reached. System locked for 30 seconds.`
    };
  }

  const attemptsLeft = MAX_FAILED_ATTEMPTS - failedLoginCount;
  logAuditEvent({
    event: 'LOGIN_FAILURE',
    resource: 'AUTH',
    status: 'FAILURE',
    details: `Invalid credentials entered for ${cleanEmail}. ${attemptsLeft} attempts remaining.`
  });

  return {
    success: false,
    message: `Invalid email or password. ${attemptsLeft} attempt(s) remaining before security lockout.`
  };
}

/**
 * Validates active admin session and session timeout.
 * @returns {boolean}
 */
export function isSessionValid() {
  const token = sessionStorage.getItem('lokal_adalat_admin_token');
  const lastAct = sessionStorage.getItem('lokal_adalat_last_activity');
  if (!token || !lastAct) return false;

  const lastActTime = parseInt(lastAct, 10);
  if (isNaN(lastActTime) || (Date.now() - lastActTime > SESSION_TIMEOUT_MS)) {
    logoutAdmin('Session expired due to 15 minutes of inactivity.');
    return false;
  }

  // Update activity timestamp
  sessionStorage.setItem('lokal_adalat_last_activity', Date.now().toString());
  return true;
}

/**
 * Terminate active admin session.
 * @param {string} reason 
 */
export function logoutAdmin(reason = 'User logged out') {
  logAuditEvent({
    event: 'LOGOUT',
    resource: 'AUTH',
    status: 'SUCCESS',
    details: reason
  });
  sessionStorage.removeItem('lokal_adalat_admin_token');
  sessionStorage.removeItem('lokal_adalat_last_activity');
  activeSessionToken = null;
}

/**
 * Security Inspector for file uploads: checks MIME types, extension whitelist, and file size limits.
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileName = file.name || '';
  const fileSize = file.size || 0;
  const fileType = file.type || '';

  // 1. File Size Check
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    logAuditEvent({
      event: 'FILE_REJECTED',
      resource: 'MEDIA',
      status: 'REJECTED',
      details: `File ${fileName} exceeded max allowed size of 15MB (${(fileSize / (1024 * 1024)).toFixed(1)}MB)`
    });
    return { valid: false, error: `File size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of 15MB.` };
  }

  // 2. Disallowed Executable Extensions Check
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    logAuditEvent({
      event: 'SECURITY_ALERT_MALICIOUS_FILE',
      resource: 'SECURITY',
      status: 'BLOCKED',
      details: `Blocked upload of executable file: ${fileName} (${ext})`
    });
    return { valid: false, error: `Security Risk Blocked: File type '${ext}' is not permitted.` };
  }

  // 3. MIME Type Whitelist Check
  const isAllowedMime = ALLOWED_MIME_PREFIXES.some(prefix => fileType.startsWith(prefix));
  if (!isAllowedMime && fileType !== '') {
    logAuditEvent({
      event: 'FILE_REJECTED',
      resource: 'MEDIA',
      status: 'REJECTED',
      details: `File ${fileName} rejected due to invalid MIME type '${fileType}'`
    });
    return { valid: false, error: `Invalid file format '${fileType}'. Please upload an image or video file.` };
  }

  logAuditEvent({
    event: 'FILE_VALIDATED',
    resource: 'MEDIA',
    status: 'SUCCESS',
    details: `File ${fileName} (${fileType}, ${(fileSize / 1024).toFixed(0)}KB) validated successfully.`
  });

  return { valid: true };
}
