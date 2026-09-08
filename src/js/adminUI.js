/**
 * @file adminUI.js
 * @description Admin Dashboard UI Controller, Forms, Modals, Tables, and Reactive CRUD handlers.
 */

import { authenticateAdmin, checkLockoutStatus, isSessionValid, logoutAdmin, getAuditLogs, clearAuditLogs, validateMediaFile, escapeHTML, sanitizeInput } from './security.js';

const sanitizeHTML = (str) => escapeHTML(str || '');
import { getCollection, createItem, updateItem, deleteItem, duplicateItem, backupAppState, restoreAppState, resetToDefaults, subscribeDataChange } from './adminStorage.js';
import { showToast, showConfirmModal } from './toast.js';
import { showView } from './router.js';
import { ApiClient, formatMediaUrl } from './apiClient.js';

const eyeIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeOffIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
const editIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const duplicateIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const deleteIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const plusIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

let activeTab = 'overview';
let activeArticleFilterCourt = 'ALL';
let activeArticleFilterStatus = 'ALL';
let articleSearchQuery = '';
let activeMediaViewMode = 'grid'; // 'grid' | 'list'

/**
 * Initializes Admin Login & Dashboard UI controllers.
 */
export function initAdminUI() {
  setupLoginView();
  setupDashboardTopNav();
  setupSidebarTabs();
  setupArticlesCMS();
  setupVideosCMS();
  setupNewsCMS();
  setupMediaLibrary();
  setupAuditLogsUI();
  setupSettingsUI();

  // Attach global click event delegation for robust modal triggers
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('#btnAddArticleModal, .btn-add-article-trigger');
    if (addBtn) {
      e.preventDefault();
      openArticleModal(null);
      return;
    }

    const editBtn = e.target.closest('.btn-edit-article');
    if (editBtn) {
      e.preventDefault();
      const articleId = editBtn.dataset.id;
      const allArticles = getCollection('articles');
      const item = allArticles.find(a => String(a.id) === String(articleId));
      openArticleModal(item || { id: articleId });
      return;
    }

    const closeBtn = e.target.closest('#btnCloseArticleModal, #btnCancelArticleModal');
    if (closeBtn) {
      e.preventDefault();
      closeArticleModal();
      return;
    }
  });

  // Expose methods globally for inline triggers
  window.openArticleModal = openArticleModal;
  window.closeArticleModal = closeArticleModal;

  // Subscribe to storage changes to refresh tables in real-time
  subscribeDataChange(() => {
    refreshCurrentTab();
  });
}

/**
 * Refresh active dashboard tab content.
 */
export function refreshCurrentTab() {
  if (!isSessionValid()) return;
  renderDashboardKPIs();

  if (activeTab === 'overview') renderOverviewTab();
  else if (activeTab === 'articles') renderArticlesTable();
  else if (activeTab === 'videos') renderVideosTable();
  else if (activeTab === 'news') renderNewsManager();
  else if (activeTab === 'audit') renderAuditLogsTable();
}

/* ==========================================================================
   1. LOGIN VIEW CONTROLLER
   ========================================================================== */
function setupLoginView() {
  const form = document.getElementById('adminLoginForm');
  const emailInput = document.getElementById('adminEmailInput');
  const passwordInput = document.getElementById('adminPasswordInput');
  const togglePassBtn = document.getElementById('btnTogglePassword');
  const lockoutBanner = document.getElementById('adminLockoutBanner');
  const lockoutSecondsSpan = document.getElementById('lockoutSecondsSpan');

  if (togglePassBtn && passwordInput) {
    togglePassBtn.innerHTML = eyeIcon;
    togglePassBtn.addEventListener('click', () => {
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      togglePassBtn.innerHTML = isPass ? eyeOffIcon : eyeIcon;
    });
  }

  // Periodic lockout status ticker
  setInterval(() => {
    const lockout = checkLockoutStatus();
    if (lockoutBanner && lockoutSecondsSpan) {
      if (lockout.isLocked) {
        lockoutBanner.style.display = 'flex';
        lockoutSecondsSpan.textContent = lockout.remainingSeconds.toString();
        if (form) {
          form.querySelectorAll('input, button').forEach(el => el.disabled = true);
        }
      } else {
        lockoutBanner.style.display = 'none';
        if (form) {
          form.querySelectorAll('input, button').forEach(el => el.disabled = false);
        }
      }
    }
  }, 1000);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';

      const result = authenticateAdmin(email, password);
      if (result.success) {
        showToast(result.message, 'success');
        if (passwordInput) passwordInput.value = '';
        showView('adminDashboard', true);
        refreshCurrentTab();
      } else {
        showToast(result.message, 'error', 4500);
      }
    });
  }
}

/* ==========================================================================
   2. TOP NAV & SIDEBAR NAVIGATION
   ========================================================================== */
function setupDashboardTopNav() {
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      showConfirmModal({
        title: 'Logout',
        message: 'Are you sure you want to end your administrator session?',
        confirmText: 'Logout',
        onConfirm: () => {
          logoutAdmin('User clicked logout button');
          showToast('Logged out successfully.', 'info');
          showView('adminLogin', true);
        }
      });
    });
  }
}

function setupSidebarTabs() {
  const navItems = document.querySelectorAll('.admin-sidebar-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabTarget = item.dataset.tab;
      if (!tabTarget) return;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
      const targetContent = document.getElementById(`adminTab_${tabTarget}`);
      if (targetContent) {
        targetContent.style.display = 'block';
      }

      activeTab = tabTarget;
      refreshCurrentTab();
    });
  });
}

/* ==========================================================================
   3. DASHBOARD OVERVIEW & KPIS
   ========================================================================== */
function renderDashboardKPIs() {
  const articles = getCollection('articles');
  const videos = getCollection('videos');
  const news = getCollection('news') || [];
  const logs = getAuditLogs();

  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  const activeVideos = videos.length;
  const totalNews = news.length;
  const failedLogins = logs.filter(l => l.event === 'LOGIN_FAILURE' || l.event === 'LOCKOUT_TRIGGERED').length;

  const elemTotal = document.getElementById('kpiTotalArticles');
  const elemPub = document.getElementById('kpiPublishedArticles');
  const elemDraft = document.getElementById('kpiDraftArticles');
  const elemVideos = document.getElementById('kpiActiveVideos');
  const elemNews = document.getElementById('kpiBreakingNews');
  const elemSecurity = document.getElementById('kpiSecurityStatus');

  if (elemTotal) elemTotal.textContent = totalArticles;
  if (elemPub) elemPub.textContent = publishedArticles;
  if (elemDraft) elemDraft.textContent = draftArticles;
  if (elemVideos) elemVideos.textContent = activeVideos;
  if (elemNews) elemNews.textContent = totalNews;
  if (elemSecurity) {
    if (failedLogins > 3) {
      elemSecurity.textContent = 'WARNING';
      elemSecurity.className = 'text-danger';
    } else {
      elemSecurity.textContent = 'SECURE';
      elemSecurity.className = 'text-success';
    }
  }
}

function renderOverviewTab() {
  const activityListElem = document.getElementById('overviewRecentActivityList');
  if (!activityListElem) return;

  const logs = getAuditLogs().slice(0, 6);
  if (!logs.length) {
    activityListElem.innerHTML = `<div class="admin-empty-state">No recent activity logged.</div>`;
    return;
  }

  activityListElem.innerHTML = logs.map(log => `
    <div class="activity-feed-item">
      <div class="activity-badge badge-${log.status.toLowerCase()}">${log.event}</div>
      <div class="activity-details">
        <p class="activity-text">${escapeHTML(log.details)}</p>
        <span class="activity-time">${new Date(log.timestamp).toLocaleTimeString()} · ${log.resource}</span>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   4. ARTICLES CMS
   ========================================================================== */
function setupArticlesCMS() {
  const searchInput = document.getElementById('articleCMSFilterSearch');
  const courtSelect = document.getElementById('articleCMSFilterCourt');
  const statusSelect = document.getElementById('articleCMSFilterStatus');
  const btnAdd = document.getElementById('btnAddArticleModal');

  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        articleSearchQuery = e.target.value.toLowerCase().trim();
        renderArticlesTable();
      }, 250);
    });
  }

  if (courtSelect) {
    courtSelect.addEventListener('change', (e) => {
      activeArticleFilterCourt = e.target.value;
      renderArticlesTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      activeArticleFilterStatus = e.target.value;
      renderArticlesTable();
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      openArticleModal(null);
    });
  }

  setupArticleModalForm();
}

function renderArticlesTable() {
  const tableBody = document.getElementById('articlesCMSTableBody');
  if (!tableBody) return;

  let articles = getCollection('articles');

  // Filter Court
  if (activeArticleFilterCourt !== 'ALL') {
    articles = articles.filter(a => String(a.court || '').toUpperCase() === activeArticleFilterCourt.toUpperCase());
  }

  // Filter Status
  if (activeArticleFilterStatus !== 'ALL') {
    articles = articles.filter(a => (a.status || 'published').toLowerCase() === activeArticleFilterStatus.toLowerCase());
  }

  // Search
  if (articleSearchQuery) {
    articles = articles.filter(a => 
      (a.title || '').toLowerCase().includes(articleSearchQuery) ||
      (a.author || '').toLowerCase().includes(articleSearchQuery) ||
      (a.excerpt || '').toLowerCase().includes(articleSearchQuery)
    );
  }

  if (!articles.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No articles found matching filters.</td></tr>`;
    return;
  }

  tableBody.innerHTML = articles.map(item => `
    <tr>
      <td>
        <div class="table-article-title-wrap">
          <img src="${escapeHTML(item.image || '/images/supreme-court.jpg')}" class="table-thumb" alt="${escapeHTML(item.title)}">
          <div>
            <div class="table-title">${escapeHTML(item.title)}</div>
            <div class="table-sub">${escapeHTML(item.readTime || '5 min read')} · ${escapeHTML(item.author || 'Editorial Desk')}</div>
          </div>
        </div>
      </td>
      <td>${item.court ? `<span class="court-tag ${String(item.court).toUpperCase().includes('HIGH') ? 'tag-high-court' : String(item.court).toUpperCase().includes('SESSIONS') ? 'tag-sessions-court' : 'tag-supreme-court'}">${escapeHTML(item.court)}</span>` : '<span class="text-muted">N/A</span>'}</td>
      <td><span class="status-badge status-${item.status || 'published'}">${escapeHTML(item.status || 'published')}</span></td>
      <td>${escapeHTML(item.publishDate || item.date || '2026-07-22')}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-edit-article" data-id="${item.id}" title="Edit Article">${editIcon}</button>
          <button class="btn-icon btn-duplicate-article" data-id="${item.id}" title="Duplicate">${duplicateIcon}</button>
          <button class="btn-icon btn-delete-article" data-id="${item.id}" title="Delete">${deleteIcon}</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach table button click handlers
  tableBody.querySelectorAll('.btn-edit-article').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const articleId = btn.dataset.id;
      const allArticles = getCollection('articles');
      const item = allArticles.find(a => String(a.id) === String(articleId));
      openArticleModal(item || { id: articleId });
    };
  });

  tableBody.querySelectorAll('.btn-duplicate-article').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      duplicateItem('articles', btn.dataset.id);
      showToast('Article duplicated as draft.', 'success');
    };
  });

  tableBody.querySelectorAll('.btn-delete-article').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showConfirmModal({
        title: 'Delete Article',
        message: 'Are you sure you want to permanently delete this article?',
        confirmText: 'Delete',
        onConfirm: async () => {
          await deleteItem('articles', btn.dataset.id);
          showToast('Article deleted successfully.', 'info');
          refreshCurrentTab();
        }
      });
    };
  });
}

/* Article Section Row Builder */
function renderArticleSectionRow(title = '', content = '', imageUrl = '', caption = '') {
  const container = document.getElementById('articleSectionsContainer');
  if (!container) return;

  const count = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'article-section-item';
  row.style.cssText = 'background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 8px;';
  
  const uploadIcon = `<svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;

  row.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span style="font-weight: 700; font-size: 13px; color: #475569;" class="sec-badge-label">Section #${count}</span>
      <button type="button" class="btn-admin-danger btn-remove-section" style="font-size: 12px; padding: 6px 14px; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">${deleteIcon} Remove Section</button>
    </div>
    <div class="form-group" style="margin-bottom: 10px;">
      <input type="text" class="form-control sec-title-input" placeholder="Section Title (e.g. 01 Introduction or Background of the Case)" value="${sanitizeHTML(title)}">
    </div>
    <div class="form-group" style="margin-bottom: 10px;">
      <textarea class="form-control sec-content-input" rows="3" placeholder="Enter unique text content for this section...">${sanitizeHTML(content)}</textarea>
    </div>
    <div class="form-group" style="margin-bottom: 10px;">
      <label class="form-label" style="font-size: 12px; font-weight: 600; color: #64748B; margin-bottom: 4px; display: block;">Section Image (Optional)</label>
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" class="form-control sec-image-input" placeholder="Image URL or upload file..." value="${sanitizeHTML(imageUrl)}" style="flex: 1;">
        <input type="file" class="sec-image-file-input" accept="image/*" style="display: none;">
        <button type="button" class="btn-admin-secondary btn-upload-sec-img" style="white-space: nowrap; font-size: 12px; padding: 8px 14px; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
          ${uploadIcon} Upload Image
        </button>
      </div>
      <div class="sec-image-preview-wrapper" style="margin-top: 8px; ${imageUrl ? 'display: block;' : 'display: none;'}">
        <div style="position: relative; display: inline-block;">
          <img class="sec-image-preview" src="${imageUrl}" style="max-height: 100px; max-width: 100%; border-radius: 8px; border: 1px solid #CBD5E1; object-fit: cover; display: block;">
          <button type="button" class="btn-remove-sec-img" style="position: absolute; top: -6px; right: -6px; background: #DC2626; color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;" title="Remove Image">&times;</button>
        </div>
      </div>
    </div>
    <div class="form-group sec-caption-group" style="margin-bottom: 0; ${imageUrl ? 'display: block;' : 'display: none;'}">
      <label class="form-label" style="font-size: 12px; font-weight: 600; color: #64748B; margin-bottom: 4px; display: block;">Photo Caption / Credit (Optional)</label>
      <input type="text" class="form-control sec-caption-input" placeholder="e.g. The Constitution Bench during hearings. Photo: Supreme Court of India / PTI" value="${sanitizeHTML(caption)}">
    </div>
  `;

  // Attach section image file upload event listeners
  const fileInput = row.querySelector('.sec-image-file-input');
  const uploadBtn = row.querySelector('.btn-upload-sec-img');
  const imgInput = row.querySelector('.sec-image-input');
  const previewWrapper = row.querySelector('.sec-image-preview-wrapper');
  const previewImg = row.querySelector('.sec-image-preview');
  const removeImgBtn = row.querySelector('.btn-remove-sec-img');
  const captionGroup = row.querySelector('.sec-caption-group');

  if (uploadBtn && fileInput) {
    uploadBtn.onclick = () => fileInput.click();
  }

  const updatePreview = (url) => {
    if (url) {
      previewImg.src = url;
      previewWrapper.style.display = 'block';
      if (captionGroup) captionGroup.style.display = 'block';
    } else {
      previewWrapper.style.display = 'none';
      if (captionGroup) captionGroup.style.display = 'none';
      previewImg.src = '';
    }
  };

  if (imgInput) {
    imgInput.oninput = () => updatePreview(imgInput.value.trim());
  }

  if (fileInput) {
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const val = validateMediaFile(file);
      if (!val.valid) {
        showToast(val.error, 'error');
        fileInput.value = '';
        return;
      }

      showToast('Uploading section image...', 'info');
      const apiRes = await ApiClient.uploadFile(file);
      if (apiRes && apiRes.success && apiRes.data && apiRes.data.storage_path) {
        const fullUrl = formatMediaUrl(apiRes.data.storage_path);
        imgInput.value = fullUrl;
        updatePreview(fullUrl);
        showToast('Section image uploaded successfully!', 'success');
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          imgInput.value = evt.target.result;
          updatePreview(evt.target.result);
          showToast('Section image uploaded.', 'success');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (removeImgBtn) {
    removeImgBtn.onclick = () => {
      imgInput.value = '';
      if (fileInput) fileInput.value = '';
      updatePreview('');
    };
  }

  row.querySelector('.btn-remove-section').onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showConfirmModal({
      title: 'Remove Article Section',
      message: 'Are you sure you want to remove this section from the article?',
      confirmText: 'Remove Section',
      cancelText: 'Cancel',
      onConfirm: () => {
        row.remove();
        updateSectionBadgeLabels();
        showToast('Article section removed.', 'info');
      }
    });
  };

  container.appendChild(row);
}

function updateSectionBadgeLabels() {
  const container = document.getElementById('articleSectionsContainer');
  if (!container) return;
  Array.from(container.children).forEach((el, idx) => {
    const label = el.querySelector('.sec-badge-label');
    if (label) label.textContent = `Section #${idx + 1}`;
  });
}

/* Article Modal Form Setup */
function setupArticleModalForm() {
  const modal = document.getElementById('articleFormModal');
  const form = document.getElementById('articleModalForm');
  const titleInput = document.getElementById('artTitleInput');
  const slugInput = document.getElementById('artSlugInput');
  const fileInput = document.getElementById('artImageFileInput');
  const imageInput = document.getElementById('artImageInput');
  const targetSectionSelect = document.getElementById('artTargetSectionSelect');
  const courtGroup = document.getElementById('artCourtGroup');
  const addSecBtn = document.getElementById('btnAddArticleSection');

  if (addSecBtn) {
    addSecBtn.onclick = (e) => {
      e.preventDefault();
      renderArticleSectionRow();
    };
  }

  if (targetSectionSelect && courtGroup) {
    targetSectionSelect.addEventListener('change', (e) => {
      if (e.target.value === 'latest-news-sec') {
        courtGroup.style.display = 'block';
      } else {
        courtGroup.style.display = 'none';
      }
    });
  }

  if (titleInput && slugInput) {
    titleInput.addEventListener('input', () => {
      slugInput.value = titleInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const val = validateMediaFile(file);
      if (!val.valid) {
        showToast(val.error, 'error');
        fileInput.value = '';
        return;
      }

      showToast('Uploading image...', 'info');
      const apiRes = await ApiClient.uploadFile(file);
      if (apiRes && apiRes.success && apiRes.data && apiRes.data.storage_path) {
        if (imageInput) imageInput.value = formatMediaUrl(apiRes.data.storage_path);
        showToast('Image uploaded and verified successfully!', 'success');
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (imageInput) imageInput.value = evt.target.result;
          showToast('Image uploaded and verified.', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('artEditId') ? document.getElementById('artEditId').value : '';
      const titleElem = document.getElementById('artTitleInput');
      const title = titleElem ? sanitizeInput(titleElem.value) : '';
      const targetSecElem = document.getElementById('artTargetSectionSelect');
      const targetSection = targetSecElem ? targetSecElem.value : 'articles-to-read-sec';
      const courtElem = document.getElementById('artCourtSelect');
      const court = courtElem ? courtElem.value : 'SUPREME COURT';
      const authElem = document.getElementById('artAuthorInput');
      const author = authElem ? sanitizeInput(authElem.value || 'Editorial Desk') : 'Editorial Desk';
      const readElem = document.getElementById('artReadTimeInput');
      const readTime = readElem ? sanitizeInput(readElem.value || '5 min read') : '5 min read';
      const statusElem = document.getElementById('artStatusSelect');
      const status = statusElem ? statusElem.value : 'published';
      const imgElem = document.getElementById('artImageInput');
      const image = imgElem ? imgElem.value : '';
      const excElem = document.getElementById('artExcerptInput');
      const excerpt = excElem ? sanitizeInput(excElem.value) : '';

      if (!title) {
        showToast('Title is required', 'error');
        return;
      }

      // Collect section objects with image URLs and photo captions
      const sectionRows = Array.from(document.querySelectorAll('#articleSectionsContainer .article-section-item'));
      const sections = sectionRows.map((row, idx) => {
        const titleIn = row.querySelector('.sec-title-input');
        const contentIn = row.querySelector('.sec-content-input');
        const imageIn = row.querySelector('.sec-image-input');
        const captionIn = row.querySelector('.sec-caption-input');
        const titleVal = titleIn ? sanitizeInput(titleIn.value.trim()) : `Section ${idx + 1}`;
        const contentVal = contentIn ? sanitizeInput(contentIn.value.trim()) : '';
        const imageVal = imageIn ? imageIn.value.trim() : '';
        const captionVal = captionIn ? sanitizeInput(captionIn.value.trim()) : '';
        return { title: titleVal || `Section ${idx + 1}`, content: contentVal, image: imageVal, caption: captionVal };
      });

      const finalSections = sections.length ? sections : [
        { title: '01 Introduction', content: excerpt }
      ];

      const slugElem = document.getElementById('artSlugInput');
      const seoTitleElem = document.getElementById('artSeoTitleInput');
      const seoDescElem = document.getElementById('artSeoDescInput');
      const pubDateElem = document.getElementById('artPublishDateInput');

      const articlePayload = {
        title,
        slug: slugElem ? sanitizeInput(slugElem.value) : '',
        targetSection,
        court,
        category: 'Legal Analysis',
        author,
        readTime,
        status,
        image,
        excerpt,
        sections: finalSections,
        paragraphs: finalSections,
        tocSections: finalSections.map(s => s.title),
        body: JSON.stringify(finalSections),
        seoTitle: seoTitleElem ? sanitizeInput(seoTitleElem.value || title) : title,
        seoDescription: seoDescElem ? sanitizeInput(seoDescElem.value || excerpt) : excerpt,
        publishDate: pubDateElem ? pubDateElem.value : new Date().toISOString().split('T')[0]
      };

      if (id) {
        await updateItem('articles', id, articlePayload);
        showToast('Article updated successfully!', 'success');
      } else {
        await createItem('articles', articlePayload);
        showToast('New article published successfully!', 'success');
      }

      closeArticleModal();
      refreshCurrentTab();
    });
  }

  const closeX = document.getElementById('btnCloseArticleModal');
  const cancelBtn = document.getElementById('btnCancelArticleModal');
  if (closeX) closeX.onclick = closeArticleModal;
  if (cancelBtn) cancelBtn.onclick = closeArticleModal;
}

function openArticleModal(item = null) {
  const modal = document.getElementById('articleFormModal');
  const title = document.getElementById('articleModalHeaderTitle');
  const targetSectionSelect = document.getElementById('artTargetSectionSelect');
  const courtGroup = document.getElementById('artCourtGroup');
  if (!modal) return;

  const targetSec = item ? item.targetSection || 'articles-to-read-sec' : 'articles-to-read-sec';
  if (targetSectionSelect) targetSectionSelect.value = targetSec;

  if (courtGroup) {
    courtGroup.style.display = 'block';
  }

  const editIdElem = document.getElementById('artEditId');
  const titleInputElem = document.getElementById('artTitleInput');
  const slugInputElem = document.getElementById('artSlugInput');
  const courtSelectElem = document.getElementById('artCourtSelect');
  const authorInputElem = document.getElementById('artAuthorInput');
  const readTimeInputElem = document.getElementById('artReadTimeInput');
  const statusSelectElem = document.getElementById('artStatusSelect');
  const imageInputElem = document.getElementById('artImageInput');
  const excerptInputElem = document.getElementById('artExcerptInput');
  const seoTitleInputElem = document.getElementById('artSeoTitleInput');
  const seoDescInputElem = document.getElementById('artSeoDescInput');
  const publishDateInputElem = document.getElementById('artPublishDateInput');

  if (editIdElem) editIdElem.value = item ? item.id : '';
  if (titleInputElem) titleInputElem.value = item ? item.title || '' : '';
  if (slugInputElem) slugInputElem.value = item ? item.slug || '' : '';
  if (courtSelectElem) courtSelectElem.value = item ? item.court || 'SUPREME COURT' : 'SUPREME COURT';
  if (authorInputElem) authorInputElem.value = item ? item.author || 'Editorial Desk' : 'Editorial Desk';
  if (readTimeInputElem) readTimeInputElem.value = item ? item.readTime || '5 min read' : '5 min read';
  if (statusSelectElem) statusSelectElem.value = item ? item.status || 'published' : 'published';
  if (imageInputElem) imageInputElem.value = item ? item.image || item.featured_image || '' : '';
  if (excerptInputElem) excerptInputElem.value = item ? item.excerpt || '' : '';

  // Render Section Items
  const sectionsContainer = document.getElementById('articleSectionsContainer');
  if (sectionsContainer) {
    sectionsContainer.innerHTML = '';

    let rawSections = item ? (item.sections || item.paragraphs) : null;
    if (typeof rawSections === 'string' && rawSections.startsWith('[')) {
      try { rawSections = JSON.parse(rawSections); } catch(e) { rawSections = null; }
    }

    if (Array.isArray(rawSections) && rawSections.length > 0) {
      const defaultTitles = [
        "01 Introduction",
        "02 Background of the Case",
        "03 Constitutional Questions",
        "04 Key Arguments Presented",
        "05 Key Observations",
        "06 Implications for Digital Rights",
        "07 What Happens Next?"
      ];

      rawSections.forEach((sec, idx) => {
        if (typeof sec === 'object' && sec !== null) {
          renderArticleSectionRow(sec.title || defaultTitles[idx] || `Section ${idx + 1}`, sec.content || '', sec.image || sec.imageUrl || '', sec.caption || sec.imageCaption || '');
        } else {
          renderArticleSectionRow(defaultTitles[idx] || `Section ${idx + 1}`, typeof sec === 'string' ? sec : (sec.content || ''), sec.image || sec.imageUrl || '', sec.caption || sec.imageCaption || '');
        }
      });
    } else {
      const initialDefaults = [
        { title: "01 Introduction", content: item ? item.excerpt || "" : "" },
        { title: "02 Background of the Case", content: "" },
        { title: "03 Constitutional Questions", content: "" },
        { title: "04 Key Arguments Presented", content: "" },
        { title: "05 Key Observations", content: "" },
        { title: "06 Implications for Digital Rights", content: "" },
        { title: "07 What Happens Next?", content: "" }
      ];
      initialDefaults.forEach(sec => renderArticleSectionRow(sec.title, sec.content));
    }
  }

  if (seoTitleInputElem) seoTitleInputElem.value = item ? item.seoTitle || '' : '';
  if (seoDescInputElem) seoDescInputElem.value = item ? item.seoDescription || '' : '';
  if (publishDateInputElem) {
    const rawDate = item ? (item.publishDate || item.date || '') : '';
    publishDateInputElem.value = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
  }

  if (title) title.textContent = item ? 'Edit Article' : 'Create New Article';
  modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 10000 !important;';
  document.body.classList.add('modal-open');
}

export function closeArticleModal() {
  const modal = document.getElementById('articleFormModal');
  if (modal) {
    modal.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
  }
  document.body.classList.remove('modal-open');
}

/* ==========================================================================
   5. VIDEOS & REELS CMS
   ========================================================================== */
function setupVideosCMS() {
  const btnAdd = document.getElementById('btnAddVideoModal');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openVideoModal(null));
  }
  setupVideoModalForm();
}

function getValidImageUrl(url, fallback = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80') {
  if (!url || typeof url !== 'string' || url.trim().length < 5) return fallback;
  const lower = url.trim().toLowerCase();
  if (lower === 'nk' || lower === 'null' || lower === 'undefined') return fallback;
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:') || lower.startsWith('/')) {
    return url.trim();
  }
  return fallback;
}

function renderVideosTable() {
  const tableBody = document.getElementById('videosCMSTableBody');
  if (!tableBody) return;

  const videos = getCollection('videos');
  if (!videos.length) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No video briefings found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = videos.map(item => {
    const thumbUrl = getValidImageUrl(item.posterImage || item.thumbnail || item.image);
    return `
      <tr>
        <td>
          <div class="table-article-title-wrap">
            <img src="${escapeHTML(thumbUrl)}" class="table-thumb" alt="${escapeHTML(item.title)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80';">
            <div>
              <div class="table-title">${escapeHTML(item.title)}</div>
              <div class="table-sub">${escapeHTML(item.videoUrl || 'Video Asset')}</div>
            </div>
          </div>
        </td>
        <td><span class="court-tag ${String(item.court || '').toUpperCase().includes('HIGH') ? 'tag-high-court' : String(item.court || '').toUpperCase().includes('SESSIONS') ? 'tag-sessions-court' : 'tag-supreme-court'}">${escapeHTML(item.court || 'SUPREME COURT')}</span></td>
        <td>${escapeHTML(item.duration || '1 min 48 sec')}</td>
        <td><span class="status-badge status-${item.status || 'published'}">${escapeHTML(item.status || 'published')}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-edit-video" data-id="${item.id}" title="Edit Video">${editIcon}</button>
            <button class="btn-icon btn-delete-video" data-id="${item.id}" title="Delete Video">${deleteIcon}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-edit-video').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const item = getCollection('videos').find(v => String(v.id) === String(btn.dataset.id));
      if (item) openVideoModal(item);
    };
  });

  tableBody.querySelectorAll('.btn-delete-video').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showConfirmModal({
        title: 'Delete Video Briefing',
        message: 'Are you sure you want to delete this video reel?',
        confirmText: 'Delete',
        onConfirm: async () => {
          await deleteItem('videos', btn.dataset.id);
          showToast('Video briefing deleted.', 'info');
          refreshCurrentTab();
        }
      });
    };
  });
}

function setupVideoModalForm() {
  const form = document.getElementById('videoModalForm');
  const closeX = document.getElementById('btnCloseVideoModal');
  const cancelBtn = document.getElementById('btnCancelVideoModal');
  const vidVideoFileInput = document.getElementById('vidVideoFileInput');
  const vidPosterFileInput = document.getElementById('vidPosterFileInput');
  const vidUrlInput = document.getElementById('vidUrlInput');
  const vidPosterInput = document.getElementById('vidPosterInput');

  if (vidVideoFileInput) {
    vidVideoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const val = validateMediaFile(file, true);
      if (!val.valid) {
        showToast(val.error, 'error');
        vidVideoFileInput.value = '';
        return;
      }
      showToast('Uploading video file to server...', 'info');
      const apiRes = await ApiClient.uploadFile(file);
      if (apiRes && apiRes.success && apiRes.data && apiRes.data.storage_path) {
        if (vidUrlInput) vidUrlInput.value = formatMediaUrl(apiRes.data.storage_path);
        showToast('Video file uploaded successfully to server!', 'success');
      } else {
        const errMsg = (apiRes && apiRes.message) ? apiRes.message : 'Backend server unreachable. Please start backend using "npm run server".';
        if (file.size > 2 * 1024 * 1024) {
          showToast(`Upload Failed (${errMsg})`, 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (vidUrlInput) vidUrlInput.value = evt.target.result;
          showToast('Small video file loaded locally.', 'info');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (vidPosterFileInput) {
    vidPosterFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const val = validateMediaFile(file);
      if (!val.valid) {
        showToast(val.error, 'error');
        vidPosterFileInput.value = '';
        return;
      }
      showToast('Uploading poster image...', 'info');
      const apiRes = await ApiClient.uploadFile(file);
      if (apiRes && apiRes.success && apiRes.data && apiRes.data.storage_path) {
        if (vidPosterInput) vidPosterInput.value = formatMediaUrl(apiRes.data.storage_path);
        showToast('Poster image uploaded successfully!', 'success');
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (vidPosterInput) vidPosterInput.value = evt.target.result;
          showToast('Poster image loaded.', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('vidEditId').value;
      const title = sanitizeInput(document.getElementById('vidTitleInput').value);
      const court = document.getElementById('vidCourtSelect').value;
      const duration = sanitizeInput(document.getElementById('vidDurationInput').value || '1 min 48 sec');
      const videoUrl = document.getElementById('vidUrlInput').value;
      const posterImage = document.getElementById('vidPosterInput').value;
      const status = document.getElementById('vidStatusSelect').value;
      const excerpt = sanitizeInput(document.getElementById('vidExcerptInput').value);
      const storyText = document.getElementById('vidStoryInput').value;
      const fullStoryParagraphs = storyText ? storyText.split(/\n\s*\n/).map(p => sanitizeInput(p.trim())).filter(Boolean) : [];

      if (!title) {
        showToast('Video title is required', 'error');
        return;
      }

      const videoPayload = {
        title,
        court,
        duration,
        videoUrl,
        posterImage,
        image: posterImage,
        thumbnail: posterImage,
        status,
        excerpt,
        fullStoryParagraphs
      };

      if (id) {
        await updateItem('videos', id, videoPayload);
        showToast('Video briefing updated successfully!', 'success');
      } else {
        await createItem('videos', videoPayload);
        showToast('New video reel published!', 'success');
      }

      closeVideoModal();
      refreshCurrentTab();
    });
  }

  if (closeX) closeX.onclick = closeVideoModal;
  if (cancelBtn) cancelBtn.onclick = closeVideoModal;
}

export function openVideoModal(item = null) {
  const modal = document.getElementById('videoFormModal');
  if (!modal) return;

  const vidEditId = document.getElementById('vidEditId');
  const vidTitleInput = document.getElementById('vidTitleInput');
  const vidCourtSelect = document.getElementById('vidCourtSelect');
  const vidDurationInput = document.getElementById('vidDurationInput');
  const vidUrlInput = document.getElementById('vidUrlInput');
  const vidPosterInput = document.getElementById('vidPosterInput');
  const vidStatusSelect = document.getElementById('vidStatusSelect');
  const vidExcerptInput = document.getElementById('vidExcerptInput');
  const vidStoryInput = document.getElementById('vidStoryInput');

  if (vidEditId) vidEditId.value = item ? item.id : '';
  if (vidTitleInput) vidTitleInput.value = item ? item.title || '' : '';
  if (vidCourtSelect) vidCourtSelect.value = item ? item.court || 'SUPREME COURT' : 'SUPREME COURT';
  if (vidDurationInput) vidDurationInput.value = item ? item.duration || '1 min 48 sec' : '1 min 48 sec';
  if (vidUrlInput) vidUrlInput.value = item ? item.videoUrl || '' : '';
  if (vidPosterInput) vidPosterInput.value = item ? item.posterImage || item.image || '' : '';
  if (vidStatusSelect) vidStatusSelect.value = item ? item.status || 'published' : 'published';
  if (vidExcerptInput) vidExcerptInput.value = item ? item.excerpt || '' : '';
  if (vidStoryInput) vidStoryInput.value = item && item.fullStoryParagraphs ? (Array.isArray(item.fullStoryParagraphs) ? item.fullStoryParagraphs.join('\n\n') : String(item.fullStoryParagraphs)) : '';

  modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 10000 !important;';
  document.body.classList.add('modal-open');
}

export function closeVideoModal() {
  const modal = document.getElementById('videoFormModal');
  if (modal) {
    modal.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
  }
  document.body.classList.remove('modal-open');
}

/* ==========================================================================
   6. NEWS MANAGER
   ========================================================================== */
function setupNewsCMS() {
  const form = document.getElementById('breakingNewsForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('breakingNewsTitleInput');
      const title = sanitizeInput(titleInput ? titleInput.value.trim() : '');
      if (!title) {
        showToast('Please enter a headline title.', 'error');
        return;
      }

      await createItem('news', {
        title,
        status: 'published',
        createdAt: new Date().toISOString()
      });

      if (titleInput) titleInput.value = '';
      showToast('Breaking news headline added successfully!', 'success');
      renderNewsManager();
    });
  }
}

function renderNewsManager() {
  const tbody = document.getElementById('breakingNewsTableBody');
  if (!tbody) return;

  const newsList = getCollection('news');
  if (!newsList || !newsList.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">No custom breaking news headlines added yet. Published top story article titles cycle automatically in the ticker loop.</td></tr>`;
    return;
  }

  tbody.innerHTML = newsList.map(item => `
    <tr>
      <td><strong style="color: #0F172A;">${escapeHTML(item.title)}</strong></td>
      <td>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}</td>
      <td style="text-align: right;">
        <button class="btn-icon btn-delete-news" data-id="${item.id}" title="Delete Headline">${deleteIcon}</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-delete-news').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      showConfirmModal({
        title: 'Delete Breaking Headline',
        message: 'Are you sure you want to remove this breaking news headline?',
        confirmText: 'Delete',
        onConfirm: async () => {
          await deleteItem('news', id);
          showToast('Headline removed.', 'info');
          renderNewsManager();
        }
      });
    };
  });
}

/* ==========================================================================
   7. MEDIA LIBRARY
   ========================================================================== */
function setupMediaLibrary() {
  const dropzone = document.getElementById('mediaDropzone');
  const fileInput = document.getElementById('mediaFileInput');
  const btnUpload = document.getElementById('btnUploadMedia');
  const viewGridBtn = document.getElementById('btnMediaGridMode');
  const viewListBtn = document.getElementById('btnMediaListMode');

  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleMediaFiles(e.target.files);
    });
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files) handleMediaFiles(e.dataTransfer.files);
    });
  }

  if (viewGridBtn && viewListBtn) {
    viewGridBtn.addEventListener('click', () => {
      activeMediaViewMode = 'grid';
      viewGridBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      renderMediaLibrary();
    });
    viewListBtn.addEventListener('click', () => {
      activeMediaViewMode = 'list';
      viewListBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      renderMediaLibrary();
    });
  }
}

function handleMediaFiles(files) {
  if (!files || !files.length) return;

  Array.from(files).forEach(async (file) => {
    const val = validateMediaFile(file);
    if (!val.valid) {
      showToast(val.error, 'error', 4500);
      return;
    }

    showToast(`Uploading asset '${file.name}'...`, 'info');
    const apiRes = await ApiClient.uploadFile(file);
    if (apiRes && apiRes.success && apiRes.data && apiRes.data.storage_path) {
      const fullUrl = formatMediaUrl(apiRes.data.storage_path);
      createItem('mediaLibrary', {
        id: apiRes.data.id || `med_${Date.now()}`,
        name: file.name,
        url: fullUrl,
        mimeType: file.type || 'image/jpeg',
        sizeFormatted: `${(file.size / 1024).toFixed(0)} KB`,
        uploadedAt: new Date().toISOString()
      });
      showToast(`Asset '${file.name}' uploaded to Media Library successfully!`, 'success');
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        createItem('mediaLibrary', {
          id: `med_${Date.now()}`,
          name: file.name,
          url: evt.target.result,
          mimeType: file.type || 'image/jpeg',
          sizeFormatted: `${(file.size / 1024).toFixed(0)} KB`,
          uploadedAt: new Date().toISOString()
        });
        showToast(`Asset '${file.name}' uploaded to Media Library.`, 'success');
      };
      reader.readAsDataURL(file);
    }
  });
}

function renderMediaLibrary() {
  const container = document.getElementById('mediaGalleryContainer');
  if (!container) return;

  const media = getCollection('mediaLibrary');
  if (!media.length) {
    container.innerHTML = `<div class="admin-empty-state">No media assets uploaded yet. Drag & drop files above.</div>`;
    return;
  }

  if (activeMediaViewMode === 'grid') {
    container.className = 'media-gallery-grid';
    container.innerHTML = media.map(item => `
      <div class="media-card">
        <div class="media-preview-wrap">
          ${item.mimeType.startsWith('video/') ? `<video src="${item.url}" controls></video>` : `<img src="${item.url}" alt="${escapeHTML(item.name)}">`}
        </div>
        <div class="media-card-info">
          <span class="media-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</span>
          <span class="media-meta">${item.sizeFormatted}</span>
        </div>
        <div class="media-actions">
          <button class="btn-sm btn-use-in-article" data-url="${item.url}" style="display: inline-flex; align-items: center; gap: 4px;">${plusIcon} Use in Article</button>
          <button class="btn-sm btn-copy-url" data-url="${item.url}">Copy URL</button>
          <button class="btn-sm btn-delete-media" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `).join('');
  } else {
    container.className = 'media-gallery-list';
    container.innerHTML = media.map(item => `
      <div class="media-list-item">
        <img src="${item.url}" class="media-list-thumb" alt="${escapeHTML(item.name)}">
        <div class="media-list-info">
          <div class="media-name">${escapeHTML(item.name)}</div>
          <div class="media-meta">${item.mimeType} · ${item.sizeFormatted}</div>
        </div>
        <div class="media-actions">
          <button class="btn-sm btn-use-in-article" data-url="${item.url}" style="display: inline-flex; align-items: center; gap: 4px;">${plusIcon} Use in Article</button>
          <button class="btn-sm btn-copy-url" data-url="${item.url}">Copy URL</button>
          <button class="btn-sm btn-delete-media" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  container.querySelectorAll('.btn-use-in-article').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.dataset.url;
      const articlesTabBtn = document.querySelector('.admin-sidebar-nav-item[data-tab="articles"]');
      if (articlesTabBtn) articlesTabBtn.click();
      openArticleModal(null);
      const imgInput = document.getElementById('artImageInput');
      if (imgInput) imgInput.value = url;
      showToast('Image attached! Fill in title and click Save Article.', 'success');
    };
  });

  container.querySelectorAll('.btn-copy-url').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(btn.dataset.url);
      showToast('Asset URL copied to clipboard!', 'info');
    };
  });

  container.querySelectorAll('.btn-delete-media').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mediaId = btn.dataset.id;
      showConfirmModal({
        title: 'Delete Media Asset',
        message: 'Are you sure you want to permanently delete this media asset?',
        confirmText: 'Delete',
        onConfirm: async () => {
          await deleteItem('mediaLibrary', mediaId);
          showToast('Media asset deleted successfully.', 'info');
          refreshCurrentTab();
        }
      });
    };
  });
}

/* ==========================================================================
   8. SECURITY AUDIT LOGS
   ========================================================================== */
function setupAuditLogsUI() {
  const btnClear = document.getElementById('btnClearAuditLogsBtn');
  const btnExport = document.getElementById('btnExportAuditLogsBtn');

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      showConfirmModal({
        title: 'Clear Security Audit Logs',
        message: 'Are you sure you want to purge all security log entries?',
        confirmText: 'Purge Logs',
        onConfirm: () => {
          clearAuditLogs();
          showToast('Audit logs cleared.', 'info');
          renderAuditLogsTable();
        }
      });
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const logs = getAuditLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lokal_adalat_audit_logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Audit logs exported as JSON file.', 'success');
    });
  }
}

function renderAuditLogsTable() {
  const tableBody = document.getElementById('auditLogsTableBody');
  if (!tableBody) return;

  const logs = getAuditLogs();
  if (!logs.length) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No audit logs recorded.</td></tr>`;
    return;
  }

  tableBody.innerHTML = logs.map(log => `
    <tr>
      <td class="text-nowrap">${new Date(log.timestamp).toLocaleString()}</td>
      <td><span class="audit-event-badge event-${log.status.toLowerCase()}">${escapeHTML(log.event)}</span></td>
      <td><strong>${escapeHTML(log.resource)}</strong></td>
      <td><span class="status-badge status-${log.status === 'SUCCESS' ? 'published' : log.status === 'LOCKOUT' ? 'archived' : 'draft'}">${log.status}</span></td>
      <td class="audit-details-cell">${escapeHTML(log.details)}</td>
    </tr>
  `).join('');
}

/* ==========================================================================
   9. SETTINGS & SYSTEM RESET
   ========================================================================== */
function setupSettingsUI() {
  const btnReset = document.getElementById('btnResetSystemData');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      showConfirmModal({
        title: 'Reset System Data to Baseline',
        message: 'WARNING: This will restore baseline articles, videos, and settings data. Proceed?',
        confirmText: 'Reset Data',
        onConfirm: () => {
          resetToDefaults(true);
          showToast('System data restored to default baseline!', 'success');
        }
      });
    });
  }
}
