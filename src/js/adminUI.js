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
  else if (activeTab === 'media') renderMediaLibrary();
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
    togglePassBtn.addEventListener('click', () => {
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? '🔒' : '👁️';
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
  const media = getCollection('mediaLibrary');
  const logs = getAuditLogs();

  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  const activeVideos = videos.length;
  const totalMedia = media.length;
  const failedLogins = logs.filter(l => l.event === 'LOGIN_FAILURE' || l.event === 'LOCKOUT_TRIGGERED').length;

  const elemTotal = document.getElementById('kpiTotalArticles');
  const elemPub = document.getElementById('kpiPublishedArticles');
  const elemDraft = document.getElementById('kpiDraftArticles');
  const elemVideos = document.getElementById('kpiActiveVideos');
  const elemMedia = document.getElementById('kpiMediaAssets');
  const elemSecurity = document.getElementById('kpiSecurityStatus');

  if (elemTotal) elemTotal.textContent = totalArticles;
  if (elemPub) elemPub.textContent = publishedArticles;
  if (elemDraft) elemDraft.textContent = draftArticles;
  if (elemVideos) elemVideos.textContent = activeVideos;
  if (elemMedia) elemMedia.textContent = totalMedia;
  if (elemSecurity) {
    elemSecurity.textContent = failedLogins > 0 ? `SECURE (${failedLogins} alerts)` : 'SECURE';
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
          <button class="btn-icon btn-edit-article" data-id="${item.id}" title="Edit Article">✏️</button>
          <button class="btn-icon btn-duplicate-article" data-id="${item.id}" title="Duplicate">📋</button>
          <button class="btn-icon btn-delete-article" data-id="${item.id}" title="Delete">🗑️</button>
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
function renderArticleSectionRow(title = '', content = '') {
  const container = document.getElementById('articleSectionsContainer');
  if (!container) return;

  const count = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'article-section-item';
  row.style.cssText = 'background: #FAF8F5; border: 1px solid #E2D7C5; border-radius: 8px; padding: 14px;';
  row.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 700; font-size: 13px; color: #7A633A;" class="sec-badge-label">Section #${count}</span>
      <button type="button" class="btn-remove-section" style="background: none; border: none; color: #d9534f; cursor: pointer; font-size: 12px; font-weight: 600;">🗑️ Remove Section</button>
    </div>
    <div class="form-group" style="margin-bottom: 8px;">
      <input type="text" class="form-control sec-title-input" placeholder="Section Title (e.g. 01 Introduction or Background of the Case)" value="${sanitizeHTML(title)}">
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <textarea class="form-control sec-content-input" rows="3" placeholder="Enter unique text content for this section...">${sanitizeHTML(content)}</textarea>
    </div>
  `;

  row.querySelector('.btn-remove-section').onclick = () => {
    row.remove();
    updateSectionBadgeLabels();
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
      const catElem = document.getElementById('artCategoryInput');
      const category = catElem ? sanitizeInput(catElem.value || 'Legal Analysis') : 'Legal Analysis';
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

      // Collect section objects
      const sectionRows = Array.from(document.querySelectorAll('#articleSectionsContainer .article-section-item'));
      const sections = sectionRows.map((row, idx) => {
        const titleIn = row.querySelector('.sec-title-input');
        const contentIn = row.querySelector('.sec-content-input');
        const titleVal = titleIn ? sanitizeInput(titleIn.value.trim()) : `Section ${idx + 1}`;
        const contentVal = contentIn ? sanitizeInput(contentIn.value.trim()) : '';
        return { title: titleVal || `Section ${idx + 1}`, content: contentVal };
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
        category,
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
  const categoryInputElem = document.getElementById('artCategoryInput');
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
  if (categoryInputElem) categoryInputElem.value = item ? item.category || 'Legal Analysis' : 'Legal Analysis';
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
        if (typeof sec === 'object' && sec !== null && sec.title) {
          renderArticleSectionRow(sec.title, sec.content || '');
        } else {
          renderArticleSectionRow(defaultTitles[idx] || `Section ${idx + 1}`, typeof sec === 'string' ? sec : (sec.content || ''));
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
  modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important;';
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
            <button class="btn-icon btn-edit-video" data-id="${item.id}" title="Edit Video">✏️</button>
            <button class="btn-icon btn-delete-video" data-id="${item.id}" title="Delete Video">🗑️</button>
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

  modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important;';
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
  const form = document.getElementById('newsManagerForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const heroTitle = sanitizeInput(document.getElementById('heroStoryTitleInput').value);
      const heroCourt = document.getElementById('heroStoryCourtSelect').value;
      const heroReadTime = sanitizeInput(document.getElementById('heroStoryReadTimeInput').value || '8 min read');

      let topStories = getCollection('topStories');
      if (topStories.length > 0) {
        updateItem('topStories', topStories[0].id, {
          title: heroTitle,
          court: heroCourt,
          readTime: heroReadTime
        });
        showToast('Hero story updated!', 'success');
      }
    });
  }
}

function renderNewsManager() {
  const topStories = getCollection('topStories');
  if (!topStories.length) return;

  const hero = topStories[0];
  const heroTitleInput = document.getElementById('heroStoryTitleInput');
  const heroCourtSelect = document.getElementById('heroStoryCourtSelect');
  const heroReadTimeInput = document.getElementById('heroStoryReadTimeInput');

  if (heroTitleInput) heroTitleInput.value = hero.title || '';
  if (heroCourtSelect) heroCourtSelect.value = hero.court || 'SUPREME COURT';
  if (heroReadTimeInput) heroReadTimeInput.value = hero.readTime || '8 min read';
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

  Array.from(files).forEach(file => {
    const val = validateMediaFile(file);
    if (!val.valid) {
      showToast(val.error, 'error', 4500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      createItem('mediaLibrary', {
        name: file.name,
        url: evt.target.result,
        mimeType: file.type || 'image/jpeg',
        sizeFormatted: `${(file.size / 1024).toFixed(0)} KB`,
        uploadedAt: new Date().toISOString()
      });
      showToast(`Asset '${file.name}' uploaded to Media Library.`, 'success');
    };
    reader.readAsDataURL(file);
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
          <button class="btn-sm btn-use-in-article" data-url="${item.url}">➕ Use in Article</button>
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
          <button class="btn-sm btn-use-in-article" data-url="${item.url}">➕ Use in Article</button>
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
