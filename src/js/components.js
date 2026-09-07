/**
 * @file components.js
 * @description UI Component rendering templates & HTML sanitization utilities.
 */

import { DEFAULT_FALLBACK_IMAGE } from './data.js';

/**
 * Escapes unsafe characters to prevent XSS.
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

/**
 * Generates an HTML card element string.
 * @param {Object} item 
 * @param {number} colIndex 
 * @param {number} rowIdx 
 * @param {boolean} isCategory 
 * @returns {string} HTML string
 */
export function createNewsCardHTML(item, colIndex = 0, rowIdx = 0, isCategory = false) {
  const imageSrc = item.image || item.featured_image || DEFAULT_FALLBACK_IMAGE;
  const courtTag = item.court || 'SUPREME COURT';
  const tagClass = courtTag.toLowerCase().includes('high') 
    ? 'tag-high-court' 
    : courtTag.toLowerCase().includes('sessions') 
      ? 'tag-sessions-court' 
      : 'tag-supreme-court';

  let aspectStyle = 'aspect-ratio: 377 / 447;';
  if (isCategory) {
    // Exact Figma specifications for View More / Category Listing page: 390x199, border-radius: 15px
    aspectStyle = 'aspect-ratio: 390 / 199 !important; border-radius: 15px !important;';
  } else if (colIndex === 1) {
    aspectStyle = (rowIdx === 1) ? 'aspect-ratio: 377 / 447;' : 'aspect-ratio: 377 / 344;';
  } else {
    aspectStyle = (rowIdx === 1) ? 'aspect-ratio: 377 / 344;' : 'aspect-ratio: 377 / 447;';
  }

  const excerptText = item.excerpt || item.summary || 'A landmark ruling clarifies that Indian courts may not re-examine merits of foreign arbitral awards under Section 48.';

  return `
    <article class="news-card card-compact ${item.aspectClass || ''} blog-click" data-id="${item.id || ''}">
      <div class="card-image-wrapper" style="${aspectStyle}">
        <img 
          src="${sanitizeHTML(imageSrc)}" 
          alt="${sanitizeHTML(item.title)}" 
          loading="lazy" 
          onerror="this.onerror=null; this.src='${DEFAULT_FALLBACK_IMAGE}';"
          style="${isCategory ? 'border-radius: 15px !important;' : ''}"
        >
        <span class="court-tag ${tagClass}">${sanitizeHTML(courtTag)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">
          <a href="#" class="blog-click" data-id="${item.id || ''}">${sanitizeHTML(item.title)}</a>
        </h3>
        <p class="card-meta">${sanitizeHTML(item.date || item.publishDate || '17 July 2025')} · ${sanitizeHTML((item.readTime || '5 min').replace(/\s*read$/i, ''))}</p>
        <p class="card-excerpt">${sanitizeHTML(excerptText)}</p>
        <div class="mobile-card-footer">
          <button class="btn-share-icon" aria-label="Share article" data-id="${item.id || ''}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
          <button class="btn-read-full blog-click" data-id="${item.id || ''}">
            Read Full Story <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Renders an array of items into a grid container element.
 * @param {HTMLElement} container 
 * @param {Array} items 
 */
export function renderGridItems(container, items) {
  if (!container) return;
  if (!items || items.length === 0) {
    renderEmptyState(container, '');
    return;
  }
  container.innerHTML = items.map(item => createNewsCardHTML(item, 0, 0, true)).join('');
}

/**
 * Renders an empty state message if no search items match.
 * @param {HTMLElement} container 
 * @param {string} query 
 */
export function renderEmptyState(container, query) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-results-box text-center" style="grid-column: 1 / -1; padding: 48px 24px;">
      <div style="width: 54px; height: 54px; border-radius: 50%; background: #FAF5E9; border: 1px solid #E8DFC8; color: #D49B15; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 20px; color: var(--color-text-dark); margin-bottom: 8px;">No Judgments Found</h3>
      <p style="font-size: 13.5px; color: var(--color-text-muted); max-width: 420px; margin: 0 auto;">
        We couldn't find any legal news or judgments matching <strong>"${sanitizeHTML(query)}"</strong>. Try checking spelling or searching another topic.
      </p>
    </div>
  `;
}
