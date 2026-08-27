/**
 * @file router.js
 * @description Single-Page Application (SPA) view switching & HTML5 History API integration.
 */

import { renderGridItems, renderEmptyState } from './components.js';
import { categoryArticlesList, defaultVideos } from './data.js';
import { getCollection } from './adminStorage.js';
import { isSessionValid } from './security.js';

let currentViewName = 'home';

const views = {
  home: null,
  search: null,
  category: null,
  article: null,
  videoListing: null,
  videoReels: null,
  mobileArticles: null,
  adminLogin: null,
  adminDashboard: null
};

/**
 * Initializes router DOM references & popstate history listener.
 */
export function initRouter() {
  views.home = document.getElementById('homeView');
  views.search = document.getElementById('searchResultsView');
  views.category = document.getElementById('categoryListingView');
  views.article = document.getElementById('articleView');
  views.videoListing = document.getElementById('videoListingView');
  views.videoReels = document.getElementById('videoReelsView');
  views.mobileArticles = document.getElementById('mobileArticlesView');
  views.adminLogin = document.getElementById('adminLoginView');
  views.adminDashboard = document.getElementById('adminDashboardView');

  // Check initial URL hash / path for /admin or #article or #category or #videos
  function handleRouteFromUrl() {
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash.includes('admin') || path.includes('admin')) {
      if (isSessionValid()) {
        showView('adminDashboard', false);
      } else {
        showView('adminLogin', false);
      }
    } else if (hash === 'videos' || hash === 'videolisting') {
      openVideoListingView();
    } else if (hash && views[hash]) {
      showView(hash, false);
    } else {
      showView('home', false);
    }
  }

  handleRouteFromUrl();

  window.addEventListener('hashchange', () => {
    handleRouteFromUrl();
  });

  // Listen for native browser Back / Forward buttons
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();

    if (state && state.view && views[state.view]) {
      showView(state.view, false);
    } else if (hash && views[hash]) {
      showView(hash, false);
    } else {
      showView('home', false);
    }
  });

  // Attach global event delegation for back buttons & article links & admin portal links
  document.addEventListener('click', (e) => {
    // 1. Back to Home & Generic Back Buttons
    const backBtn = e.target.closest('.generic-back-btn, #backToHomeBtn, .back-to-home-btn');
    if (backBtn) {
      e.preventDefault();
      showView('home', true);
      return;
    }

    // 2. Brand Logo Click (Always go home)
    const logoLink = e.target.closest('#mainBrandLogo, .brand-logo');
    if (logoLink) {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
      showView('home', true);
      return;
    }

    // 3. Article / Blog Links
    const blogLink = e.target.closest('.blog-click');
    if (blogLink) {
      e.preventDefault();
      const articleId = blogLink.dataset.id;
      if (typeof window.renderArticleDetail === 'function') {
        window.renderArticleDetail(articleId);
      }
      showView('article', true);
      return;
    }

    // 4. Admin Portal Links
    const adminLink = e.target.closest('.admin-portal-link');
    if (adminLink) {
      e.preventDefault();
      if (isSessionValid()) {
        showView('adminDashboard', true);
      } else {
        showView('adminLogin', true);
      }
      return;
    }

    // 5. View All Videos Links
    const videoLink = e.target.closest('#viewAllVideosBtn, .view-all-videos-link, a[href="#videos"]');
    if (videoLink) {
      e.preventDefault();
      openVideoListingView();
      return;
    }
  });
}

/**
 * Switches the active view on the single page app.
 * @param {string} viewName - 'home' | 'search' | 'category' | 'article' | 'videoReels' | 'mobileArticles' | 'adminLogin' | 'adminDashboard'
 * @param {boolean} pushState - Whether to record in browser history stack
 */
export function showView(viewName = 'home', pushState = true) {
  // Security Guard for Admin Dashboard
  if (viewName === 'adminDashboard' && !isSessionValid()) {
    viewName = 'adminLogin';
  }

  // Refresh DOM references if needed
  if (!views.home) {
    views.home = document.getElementById('homeView');
    views.search = document.getElementById('searchResultsView');
    views.category = document.getElementById('categoryListingView');
    views.article = document.getElementById('articleView');
    views.videoReels = document.getElementById('videoReelsView');
    views.mobileArticles = document.getElementById('mobileArticlesView');
    views.adminLogin = document.getElementById('adminLoginView');
    views.adminDashboard = document.getElementById('adminDashboardView');
  }

  Object.keys(views).forEach(key => {
    if (views[key]) {
      if (key === viewName) {
        views[key].style.display = (key === 'adminLogin') ? 'flex' : 'block';
      } else {
        views[key].style.display = 'none';
      }
    }
  });

  // Toggle active view states on body
  document.body.classList.toggle('view-category-active', viewName === 'category');
  document.body.classList.toggle('view-reels-active', viewName === 'videoReels');
  document.body.classList.toggle('view-mobile-articles-active', viewName === 'mobileArticles');
  document.body.classList.toggle('view-admin-active', viewName === 'adminDashboard' || viewName === 'adminLogin');

  if (viewName === 'adminDashboard' || viewName === 'adminLogin') {
    window.scrollTo({ top: 0, behavior: 'auto' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  currentViewName = viewName;

  if (pushState) {
    const targetHash = (viewName === 'home') ? '' : `#${viewName}`;
    const targetUrl = window.location.pathname + targetHash;
    window.history.pushState({ view: viewName }, '', targetUrl);
  }
}

/**
 * Navigates to the previous view in browser history stack or falls back to home.
 */
export function goBack() {
  showView('home', true);
}

/**
 * Opens the Category / View More Listing view with specified title & subtitle.
 * Renders ALL published articles matching court filter.
 * @param {string} title 
 * @param {string} subtitle 
 */
export function openCategoryView(title = "Supreme Court", subtitle = "The most important legal developments in the Supreme Court shaping India today.") {
  const titleElem = document.getElementById('categoryTitleText');
  const subtitleElem = document.getElementById('categorySubtitleText');
  const gridElem = document.getElementById('categoryGrid');

  if (titleElem) titleElem.textContent = title;
  if (subtitleElem) subtitleElem.textContent = subtitle;

  showView('category', true);

  if (gridElem) {
    const allArticles = getCollection('articles');
    const publishedArticles = (allArticles || []).filter(a => a.status === 'published');
    
    const filterKey = (title || '').toUpperCase().trim();
    let filteredList = publishedArticles;
    
    if (filterKey.includes('HIGH')) {
      filteredList = publishedArticles.filter(a => (a.court || '').toUpperCase().includes('HIGH'));
    } else if (filterKey.includes('SESSIONS')) {
      filteredList = publishedArticles.filter(a => (a.court || '').toUpperCase().includes('SESSIONS'));
    } else if (filterKey.includes('SUPREME')) {
      filteredList = publishedArticles.filter(a => (a.court || 'SUPREME COURT').toUpperCase().includes('SUPREME'));
    } else if (filterKey.includes('ARTICLE')) {
      filteredList = publishedArticles.filter(a => !a.targetSection || a.targetSection === 'articles-to-read-sec');
    }

    if (!filteredList || filteredList.length === 0) {
      filteredList = (categoryArticlesList || []).filter(a => !a.targetSection || a.targetSection === 'articles-to-read-sec');
    }

    if (!filteredList || filteredList.length === 0) {
      renderEmptyState(gridElem, `No articles published yet for ${title}.`);
    } else {
      renderGridItems(gridElem, filteredList);
    }
  }

  // Trigger mobile vertical card feed render
  if (typeof window.renderMobileCategoryFeed === 'function') {
    window.renderMobileCategoryFeed(title);
  }
}

/**
 * Opens the Search Results view with a query string.
 * @param {string} query 
 */
export function openSearchView(query) {
  const countElem = document.getElementById('searchResultsCountText');
  const highlightElem = document.getElementById('searchQueryHighlight');
  const gridElem = document.getElementById('searchResultsGrid');

  showView('search', true);

  if (highlightElem) highlightElem.textContent = `"${query}"`;

  const trimmedQuery = query.toLowerCase().trim();
  let matches = categoryArticlesList;

  if (trimmedQuery.length > 0) {
    const filtered = categoryArticlesList.filter(item => 
      item.title.toLowerCase().includes(trimmedQuery) || 
      item.court.toLowerCase().includes(trimmedQuery)
    );
    matches = filtered;
  }

  if (countElem) {
    countElem.innerHTML = `Showing ${matches.length} results for <strong>"${query}"</strong>`;
  }

  if (gridElem) {
    if (matches.length === 0) {
      renderEmptyState(gridElem, query);
    } else {
      renderGridItems(gridElem, matches);
    }
  }
}

/**
 * Opens the Mobile Video Reels View (Instagram Reel-style) on small screens.
 * @param {number} initialIndex 
 */
export function openVideoReelsView(initialIndex = 0) {
  showView('videoReels', true);
  if (typeof window.renderMobileVideoReels === 'function') {
    window.renderMobileVideoReels(initialIndex);
  }
}

/**
 * Opens the Mobile "Articles to Read" View on small screens matching reference images 1 & 2.
 */
export function openMobileArticlesView() {
  showView('mobileArticles', true);
  if (typeof window.renderMobileArticlesView === 'function') {
    window.renderMobileArticlesView();
  }
}

/**
 * Opens the Full 3x3 Video Listing Page View.
 */
export function openVideoListingView() {
  showView('videoListing', true);
  const grid = document.getElementById('videoListingGrid');
  if (grid) {
    const allVideos = getCollection('videos') || defaultVideos || [];
    grid.innerHTML = allVideos.map(v => {
      const url = v.videoUrl || v.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const poster = v.posterImage || v.image || v.thumbnail || '/images/supreme-court.jpg';
      const title = v.title || 'Delhi HC Directs Government to File Response on Electoral Bonds Case';
      const court = v.court || 'SUPREME COURT';
      const date = v.publishedDate || v.date || '17 July 2025';
      const duration = v.duration || v.readTime || '5m 28sec';

      return `
        <div class="video-card-item" 
             data-video-url="${url}" 
             data-video-title="${title}"
             data-video-court="${court}"
             data-video-date="${date}"
             data-video-duration="${duration}"
             data-video-poster="${poster}">
          <div class="video-card-thumb-wrap">
            <img src="${poster}" alt="${title}" loading="lazy" />
            <button class="video-card-play-btn" aria-label="Play video">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="video-card-body">
            <h3 class="video-card-title">${title}</h3>
            <p class="video-card-meta">${date} · ${duration}</p>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to play video in cinematic popup
    grid.querySelectorAll('.video-card-item').forEach(card => {
      card.addEventListener('click', () => {
        const videoData = {
          url: card.dataset.videoUrl,
          title: card.dataset.videoTitle,
          court: card.dataset.videoCourt,
          date: card.dataset.videoDate,
          duration: card.dataset.videoDuration,
          poster: card.dataset.videoPoster
        };
        if (typeof window.playSelectedVideo === 'function') {
          window.playSelectedVideo(videoData);
        }
      });
    });

    // Wire pagination buttons
    const paginationRow = document.querySelector('.video-pagination-row');
    if (paginationRow) {
      paginationRow.querySelectorAll('.page-num').forEach(btn => {
        btn.addEventListener('click', () => {
          paginationRow.querySelectorAll('.page-num').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
  }
}
