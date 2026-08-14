/**
 * @file adminStorage.js
 * @description Centralized Single Source of Truth for Lokal Adalat data persistence & reactive updates.
 * Manages LocalStorage with fallback defaults, reactive subscriptions, backup/restore, and CRUD helpers.
 */

import { topStories, latestNewsColumns, videoCornerList, articlesToReadList, categoryArticlesList } from './data.js';
import { logAuditEvent, sanitizeInput } from './security.js';
import { ApiClient } from './apiClient.js';

const STORAGE_KEY = 'lokal_adalat_app_data_v1';
let subscribersList = [];

// App State Data Schema
let appState = {
  articles: [],
  videos: [],
  topStories: [],
  latestNews: [],
  mediaLibrary: [],
  categories: ['Supreme Court', 'High Court', 'Sessions Court', 'Commercial Law', 'Constitutional Law'],
  tags: ['Electoral Bonds', 'Privacy Rights', 'Arbitration', 'Insolvency', 'CSR', 'Bail', 'IT Rules'],
  settings: {
    siteTitle: 'Lokal Adalat',
    siteTagline: "India's Independent Legal News & Analysis Portal",
    maintenanceMode: false,
    maxVideoReels: 10
  },
  homepageLayout: {
    showHeroSection: true,
    showLatestNewsColumns: true,
    showVideoCorner: true,
    showArticlesSection: true
  }
};

/**
 * Initializes and loads state from MySQL REST API backend or LocalStorage fallback.
 */
export async function initAdminStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = { ...appState, ...parsed };
    }

    // Sync from MySQL Backend (Primary Source of Truth)
    const backendArticles = await ApiClient.getArticles();
    if (backendArticles && backendArticles.success && Array.isArray(backendArticles.data)) {
      appState.articles = backendArticles.data;
    }

    const backendVideos = await ApiClient.getVideos();
    if (backendVideos && backendVideos.success && Array.isArray(backendVideos.data)) {
      appState.videos = backendVideos.data;
    }

    const backendMedia = await ApiClient.getMediaLibrary();
    if (backendMedia && backendMedia.success && Array.isArray(backendMedia.data)) {
      appState.mediaLibrary = backendMedia.data;
    }

    notifySubscribers();
  } catch (err) {
    console.warn('[AdminStorage] Sync with Express backend fallback to LocalStorage', err);
  }
}

/**
 * Saves current app state to LocalStorage and notifies subscribers.
 */
export function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    notifySubscribers();
  } catch (err) {
    console.error('Failed to save to LocalStorage', err);
  }
}

/**
 * Subscribes a callback to data change events.
 * @param {Function} callback 
 */
export function subscribeDataChange(callback) {
  if (typeof callback === 'function') {
    subscribersList.push(callback);
    try { callback(appState); } catch(e) {}
  }
}

function notifySubscribers() {
  subscribersList.forEach(cb => {
    try { cb(appState); } catch(e) {}
  });
}

/**
 * Gets a collection array from appState.
 * @param {string} collectionName 
 * @returns {Array}
 */
export function getCollection(collectionName) {
  return appState[collectionName] || [];
}

/**
 * Gets a item by ID from a collection.
 * @param {string} collectionName 
 * @param {string|number} id 
 */
export function getItemById(collectionName, id) {
  const collection = getCollection(collectionName);
  return collection.find(item => String(item.id) === String(id));
}

/**
 * Creates a new item in a collection.
 * @param {string} collectionName 
 * @param {Object} itemData 
 */
export async function createItem(collectionName, itemData) {
  if (!appState[collectionName]) {
    appState[collectionName] = [];
  }

  const newItem = {
    id: collectionName.slice(0, 3) + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: itemData.status || 'published',
    ...itemData
  };

  // Persist to MySQL Backend first (source of truth)
  try {
    if (collectionName === 'articles') {
      await ApiClient.createArticle(newItem);
    } else if (collectionName === 'videos') {
      await ApiClient.createVideo(newItem);
    }
  } catch (err) {
    console.error(`[AdminStorage] Failed to persist ${collectionName} to backend:`, err);
  }

  appState[collectionName].unshift(newItem);
  saveStorage();

  logAuditEvent({
    event: `${collectionName.toUpperCase()}_CREATE`,
    resource: collectionName.toUpperCase(),
    status: 'SUCCESS',
    details: `Created new ${collectionName} item: "${newItem.title || newItem.name || newItem.id}"`
  });

  return newItem;
}

/**
 * Updates an existing item in a collection.
 * @param {string} collectionName 
 * @param {string|number} id 
 * @param {Object} updates 
 */
export async function updateItem(collectionName, id, updates) {
  const collection = getCollection(collectionName);
  const index = collection.findIndex(item => String(item.id) === String(id));
  if (index === -1) return null;

  const updatedItem = {
    ...collection[index],
    ...updates,
    updatedAt: Date.now()
  };

  // Persist to MySQL Backend first (source of truth)
  try {
    if (collectionName === 'articles') {
      await ApiClient.updateArticle(id, updatedItem);
    } else if (collectionName === 'videos') {
      await ApiClient.updateVideo(id, updatedItem);
    }
  } catch (err) {
    console.error(`[AdminStorage] Failed to update ${collectionName} in backend:`, err);
  }

  collection[index] = updatedItem;
  saveStorage();

  logAuditEvent({
    event: `${collectionName.toUpperCase()}_UPDATE`,
    resource: collectionName.toUpperCase(),
    status: 'SUCCESS',
    details: `Updated ${collectionName} item ID ${id}: "${updatedItem.title || updatedItem.name || id}"`
  });

  return updatedItem;
}

/**
 * Deletes an item by ID from a collection.
 * @param {string} collectionName 
 * @param {string|number} id 
 */
export async function deleteItem(collectionName, id) {
  const collection = getCollection(collectionName);
  const index = collection.findIndex(item => String(item.id) === String(id));
  if (index === -1) return false;

  const deletedTitle = collection[index].name || collection[index].title || id;

  // Persist to MySQL Backend first (source of truth)
  try {
    if (collectionName === 'articles') {
      await ApiClient.deleteArticle(id);
    } else if (collectionName === 'videos') {
      await ApiClient.deleteVideo(id);
    } else if (collectionName === 'mediaLibrary' || collectionName === 'media') {
      await ApiClient.deleteMedia(id);
    }
  } catch (err) {
    console.error(`[AdminStorage] Failed to delete ${collectionName} from backend:`, err);
  }

  collection.splice(index, 1);
  saveStorage();

  logAuditEvent({
    event: `${collectionName.toUpperCase()}_DELETE`,
    resource: collectionName.toUpperCase(),
    status: 'SUCCESS',
    details: `Deleted ${collectionName} item ID ${id}: "${deletedTitle}"`
  });

  return true;
}

/**
 * Duplicates an existing item in a collection.
 * @param {string} collectionName 
 * @param {string|number} id 
 */
export function duplicateItem(collectionName, id) {
  const item = getItemById(collectionName, id);
  if (!item) return null;

  const copyData = { ...item };
  delete copyData.id;
  copyData.title = (copyData.title || 'Copy') + ' (Copy)';
  copyData.status = 'draft';

  return createItem(collectionName, copyData);
}

/**
 * Exports baseline appState to a JSON downloadable string.
 * @returns {string}
 */
export function backupAppState() {
  logAuditEvent({
    event: 'SYSTEM_BACKUP',
    resource: 'SYSTEM',
    status: 'SUCCESS',
    details: 'System backup JSON generated'
  });
  return JSON.stringify(appState, null, 2);
}

/**
 * Restores appState from a JSON string.
 * @param {string} jsonString 
 */
export function restoreAppState(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object') {
      appState = { ...appState, ...parsed };
      saveStorage();

      logAuditEvent({
        event: 'SYSTEM_RESTORE',
        resource: 'SYSTEM',
        status: 'SUCCESS',
        details: 'System state restored from backup JSON'
      });
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: 'Invalid JSON format.' };
  }
  return { success: false, error: 'Malformed backup data.' };
}

/**
 * Resets storage back to default initial mock data from data.js.
 * @param {boolean} notify 
 */
export function resetToDefaults(notify = true) {
  // Combine articles datasets cleanly
  const combinedArticles = [
    ...articlesToReadList.map(a => ({
      ...a,
      status: 'published',
      court: a.court || 'SUPREME COURT',
      publishDate: '2026-07-22',
      seoTitle: a.title,
      seoDescription: a.excerpt,
      seoKeywords: 'Legal News, India, Court',
      paragraphs: [
        a.excerpt,
        "Comprehensive legal commentary examining tribunal hierarchy, statutory provisions, procedural precedents, and Constitutional rights."
      ]
    })),
    ...categoryArticlesList.map(a => ({
      ...a,
      status: 'published',
      court: a.court || 'HIGH COURT',
      publishDate: a.date || '2026-07-20',
      seoTitle: a.title,
      seoDescription: a.excerpt,
      seoKeywords: 'High Court, Legal Analysis',
      paragraphs: [
        a.excerpt,
        "Judicial precedent issued by the bench outlining jurisdictional scope and statutory interpretation."
      ]
    }))
  ];

  appState = {
    articles: combinedArticles,
    videos: videoCornerList.map(v => ({
      ...v,
      status: 'published',
      isFeaturedReel: true,
      publishedDate: v.publishedDate || '16 July 2026',
      duration: v.duration || '1 min 48 sec'
    })),
    topStories: topStories.map(t => ({
      ...t,
      status: 'published'
    })),
    latestNews: latestNewsColumns.flat().map(n => ({
      ...n,
      status: 'published'
    })),
    mediaLibrary: [
      {
        id: 'med_01',
        name: 'supreme-court-hero.jpg',
        url: '/images/supreme-court.jpg',
        mimeType: 'image/jpeg',
        sizeFormatted: '240 KB',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'med_02',
        name: 'courtroom-interior.jpg',
        url: '/images/courtroom.jpg',
        mimeType: 'image/jpeg',
        sizeFormatted: '180 KB',
        uploadedAt: new Date().toISOString()
      }
    ],
    categories: ['Supreme Court', 'High Court', 'Sessions Court', 'Commercial Law', 'Constitutional Law'],
    tags: ['Electoral Bonds', 'Privacy Rights', 'Arbitration', 'Insolvency', 'CSR', 'Bail', 'IT Rules'],
    settings: {
      siteTitle: 'Lokal Adalat',
      siteTagline: "India's Independent Legal News & Analysis Portal",
      maintenanceMode: false,
      maxVideoReels: 10
    },
    homepageLayout: {
      showHeroSection: true,
      showLatestNewsColumns: true,
      showVideoCorner: true,
      showArticlesSection: true
    }
  };

  saveStorage();

  if (notify) {
    logAuditEvent({
      event: 'SYSTEM_RESET',
      resource: 'SYSTEM',
      status: 'SUCCESS',
      details: 'Restored baseline data models from initial seed dataset'
    });
  }
}
