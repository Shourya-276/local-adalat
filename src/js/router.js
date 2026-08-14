/**
 * @file router.js
 * @description Single-Page Application (SPA) view switching & HTML5 History API integration.
 */

import { renderGridItems, renderEmptyState } from './components.js';
import { categoryArticlesList } from './data.js';
import { getCollection } from './adminStorage.js';
import { isSessionValid } from './security.js';

let currentViewName = 'home';

const views = {
  home: null,
  search: null,
  category: null,
  article: null,
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
  views.videoReels = document.getElementById('videoReelsView');
  views.mobileArticles = document.getElementById('mobileArticlesView');
  views.adminLogin = document.getElementById('adminLoginView');
  views.adminDashboard = document.getElementById('adminDashboardView');

  // Check initial URL hash / path for /admin
  function checkAdminRoute() {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash.includes('admin') || path.includes('admin')) {
      if (isSessionValid()) {
        showView('adminDashboard', false);
      } else {
        showView('adminLogin', false);
      }
    }
  }

  checkAdminRoute();

  window.addEventListener('hashchange', () => {
    checkAdminRoute();
  });

  // Listen for native browser Back / Forward buttons
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (!state || state.view === 'home') {
      showView('home', false);
    } else if (state.view === 'article') {
      showView('article', false);
    } else if (state.view === 'category') {
      showView('category', false);
    } else if (state.view === 'search') {
      showView('search', false);
    } else if (state.view === 'videoReels') {
      showView('videoReels', false);
    } else if (state.view === 'mobileArticles') {
      showView('mobileArticles', false);
    } else if (state.view === 'adminLogin') {
      showView('adminLogin', false);
    } else if (state.view === 'adminDashboard') {
      showView('adminDashboard', false);
    }
  });

  // Attach global event delegation for back buttons & article links & admin portal links
  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest('.generic-back-btn');
    if (backBtn) {
      e.preventDefault();
      goBack();
      return;
    }

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

  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].style.display = (key === viewName) ? 'block' : 'none';
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

  if (pushState && viewName !== currentViewName) {
    window.history.pushState({ view: viewName }, '', `#${viewName}`);
    currentViewName = viewName;
  }
}

/**
 * Navigates to the previous view in browser history stack.
 */
export function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    showView('home', true);
  }
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
