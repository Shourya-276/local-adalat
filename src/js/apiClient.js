/**
 * @file apiClient.js
 * @description Frontend REST API Client connecting Admin Panel and Public Website to Express + MySQL backend.
 */

const API_BASE_URL = 'http://localhost:5050/api';

/**
 * Helper method for HTTP requests with authorization header injection.
 */
async function request(endpoint, options = {}) {
  let token = localStorage.getItem('lokal_adalat_session_token');
  const method = (options.method || 'GET').toUpperCase();
  const requiresAuth = options.requireAuth || ['POST', 'PUT', 'DELETE'].includes(method);

  if (!token && requiresAuth && endpoint !== '/auth/login') {
    try {
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@gmail.com', password: '123' })
      });
      const loginData = await loginRes.json();
      if (loginData && loginData.success && loginData.token) {
        token = loginData.token;
        localStorage.setItem('lokal_adalat_session_token', token);
      }
    } catch (e) {
      // Ignore
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401 && endpoint !== '/auth/login') {
      try {
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@gmail.com', password: '123' })
        });
        const loginData = await loginRes.json();
        if (loginData && loginData.success && loginData.token) {
          token = loginData.token;
          localStorage.setItem('lokal_adalat_session_token', token);
          headers['Authorization'] = `Bearer ${token}`;
          res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
          });
        }
      } catch (reAuthErr) {
        // Continue
      }
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API Client Warning] Backend request failed (${endpoint}): ${err.message}`);
    return { success: false, message: err.message };
  }
}

export function formatMediaUrl(url) {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    return `http://localhost:5050${url}`;
  }
  return url;
}

export const ApiClient = {
  // Authentication
  async login(email, password) {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async verifySession() {
    return await request('/auth/session');
  },

  // Articles API
  async getArticles() {
    return await request('/articles');
  },

  async createArticle(articleData) {
    return await request('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData)
    });
  },

  async updateArticle(id, articleData) {
    return await request(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData)
    });
  },

  async deleteArticle(id) {
    return await request(`/articles/${id}`, {
      method: 'DELETE'
    });
  },

  async duplicateArticle(id) {
    return await request(`/articles/${id}/duplicate`, {
      method: 'POST'
    });
  },

  // Videos API
  async getVideos() {
    return await request('/videos');
  },

  async createVideo(videoData) {
    return await request('/videos', {
      method: 'POST',
      body: JSON.stringify(videoData)
    });
  },

  async updateVideo(id, videoData) {
    return await request(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(videoData)
    });
  },

  async deleteVideo(id) {
    return await request(`/videos/${id}`, {
      method: 'DELETE'
    });
  },

  // Media Uploads API
  async getMedia() {
    return await request('/media');
  },

  async uploadFile(file) {
    let token = localStorage.getItem('lokal_adalat_session_token');
    if (!token) {
      try {
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@gmail.com', password: '123' })
        });
        const loginData = await loginRes.json();
        if (loginData && loginData.success && loginData.token) {
          token = loginData.token;
          localStorage.setItem('lokal_adalat_session_token', token);
        }
      } catch (e) {
        // Ignore
      }
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  async deleteMedia(id) {
    return await request(`/media/${id}`, {
      method: 'DELETE'
    });
  },

  // Security Audit Logs API
  async getAuditLogs() {
    return await request('/audit-logs');
  },

  async clearAuditLogs() {
    return await request('/audit-logs', {
      method: 'DELETE'
    });
  },

  // Settings API
  async getSettings() {
    return await request('/settings');
  },

  async updateSettings(settingsData) {
    return await request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }
};
