/**
 * @file drawer.js
 * @description Accessible Navigation Menu Drawer component module with keyboard ESC support.
 */

import { openCategoryView, showView } from './router.js';

let menuDrawer = null;
let menuOverlay = null;
let menuToggleBtn = null;
let closeMenuBtn = null;

/**
 * Initializes the navigation menu drawer and listeners.
 */
export function initDrawer() {
  menuDrawer = document.getElementById('menuDrawer');
  menuOverlay = document.getElementById('menuOverlay');
  menuToggleBtn = document.getElementById('menuToggleBtn');
  closeMenuBtn = document.getElementById('closeMenuBtn');

  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', openDrawer);
  }

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeDrawer);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeDrawer);
  }

  // Keyboard accessibility: ESC key closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDrawerOpen()) {
      closeDrawer();
    }
  });

  // Accordion toggle inside drawer
  const accordionToggleBtn = document.getElementById('accordionToggleBtn');
  const accordionContent = document.getElementById('accordionContent');
  if (accordionToggleBtn && accordionContent) {
    accordionToggleBtn.addEventListener('click', () => {
      accordionToggleBtn.classList.toggle('collapsed');
      accordionContent.classList.toggle('closed');
      const isExpanded = !accordionContent.classList.contains('closed');
      accordionToggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }

  // Sub-nav buttons inside drawer (Supreme Court, High Courts, Sessions Courts)
  const subNavBtns = document.querySelectorAll('.sub-nav-btn');
  subNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const courtType = btn.dataset.court;
      let title = "Supreme Court";
      let subtitle = "The most important legal developments in the Supreme Court shaping India today.";

      if (courtType === 'high-court') {
        title = "High Courts";
        subtitle = "Real-time coverage from High Courts across all Indian States.";
      } else if (courtType === 'sessions-court') {
        title = "Sessions Courts";
        subtitle = "Key trial court judgments and criminal jurisprudence updates.";
      }

      closeDrawer();
      openCategoryView(title, subtitle);
    });
  });

  // Jump links inside drawer
  const navJumpLinks = document.querySelectorAll('.nav-jump-link');
  navJumpLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      const targetHash = link.getAttribute('href');

      showView('home', true);

      if (targetHash && targetHash.startsWith('#')) {
        setTimeout(() => {
          const targetElem = document.querySelector(targetHash);
          if (targetElem) {
            targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    });
  });
}

/**
 * Checks if the menu drawer is currently open.
 * @returns {boolean}
 */
export function isDrawerOpen() {
  return menuDrawer && menuDrawer.classList.contains('open');
}

/**
 * Opens the navigation menu drawer.
 */
export function openDrawer() {
  if (menuDrawer && menuOverlay) {
    menuDrawer.classList.add('open');
    menuOverlay.classList.add('active');
    if (menuToggleBtn) menuToggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    
    // Accessibility: Set focus inside drawer
    if (closeMenuBtn) closeMenuBtn.focus();
  }
}

/**
 * Closes the navigation menu drawer.
 */
export function closeDrawer() {
  if (menuDrawer && menuOverlay) {
    menuDrawer.classList.remove('open');
    menuOverlay.classList.remove('active');
    if (menuToggleBtn) menuToggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    
    // Accessibility: Return focus to hamburger button
    if (menuToggleBtn) menuToggleBtn.focus();
  }
}
