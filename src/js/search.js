/**
 * @file search.js
 * @description Debounced search input handler & search query listener.
 */

import { openSearchView, showView } from './router.js';

/**
 * Creates a debounced version of a function.
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
function debounce(func, delay = 250) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Initializes real-time search input listeners.
 */
export function initSearch() {
  const searchInput = document.getElementById('searchInput');

  if (!searchInput) return;

  const handleSearchInput = debounce((e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      openSearchView(query);
    } else {
      showView('home', true);
    }
  }, 200);

  searchInput.addEventListener('input', handleSearchInput);

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query.length > 0) {
        openSearchView(query);
      } else {
        showView('home', true);
      }
    } else if (e.key === 'Escape') {
      searchInput.value = '';
      showView('home', true);
      searchInput.blur();
    }
  });
}
