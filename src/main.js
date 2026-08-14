/**
 * @file main.js
 * @description Main application initializer for Lokal Adalat web platform.
 */

import { latestNewsColumns, supremeCourtLatestNewsColumns, highCourtLatestNewsColumns, sessionsCourtLatestNewsColumns, categoryArticlesList, videoCornerList, articlesToReadList } from './js/data.js';
import { createNewsCardHTML } from './js/components.js';
import { initRouter, openCategoryView, openVideoReelsView, openMobileArticlesView, showView } from './js/router.js';
import { initDrawer } from './js/drawer.js';
import { initSearch } from './js/search.js';

import { initAdminStorage, subscribeDataChange, getCollection } from './js/adminStorage.js';
import { initAdminUI } from './js/adminUI.js';
import { formatMediaUrl } from './js/apiClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Storage & Security Engine
  await initAdminStorage();

  // Initialize Subsystems
  initRouter();
  initDrawer();
  initSearch();
  initAdminUI();

  // DOM Elements
  const latestNewsGrid = document.getElementById('latestNewsGrid');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const mainBrandLogo = document.getElementById('mainBrandLogo');
  const pageButtons = document.querySelectorAll('.pagination .page-num');
  const tocItems = document.querySelectorAll('.toc-item');
  const prevArticleBtn = document.getElementById('prevArticleBtn');
  const nextArticleBtn = document.getElementById('nextArticleBtn');
  const newsletterForms = document.querySelectorAll('.newsletter-form, .sidebar-news-form, .drawer-news-form');

  // Brand Logo Click
  if (mainBrandLogo) {
    mainBrandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
      showView('home', true);
    });
  }

  let activeLatestNewsCourtFilter = 'supreme-court';

  /**
   * Dynamic 3-column renderer for the Latest News section on the Home page.
   * Merges dynamically published articles (targetSection === 'latest-news-sec') with baseline items.
   * @param {string} courtFilter - 'all' | 'supreme-court' | 'high-court' | 'sessions-court'
   */
  function renderLatestNewsSection(courtFilter = 'supreme-court') {
    if (!latestNewsGrid) return;
    activeLatestNewsCourtFilter = courtFilter;

    const allArticles = getCollection('articles');
    const dynamicLatestNews = (allArticles || []).filter(a => 
      (a.status || 'published') === 'published'
    );

    let filteredDynamic = dynamicLatestNews;
    if (courtFilter === 'supreme-court') {
      filteredDynamic = dynamicLatestNews.filter(a => (a.court || 'SUPREME COURT').toUpperCase().includes('SUPREME'));
    } else if (courtFilter === 'high-court') {
      filteredDynamic = dynamicLatestNews.filter(a => (a.court || '').toUpperCase().includes('HIGH'));
    } else if (courtFilter === 'sessions-court') {
      filteredDynamic = dynamicLatestNews.filter(a => (a.court || '').toUpperCase().includes('SESSIONS'));
    }

    if (!filteredDynamic || filteredDynamic.length === 0) {
      latestNewsGrid.innerHTML = `
        <div class="empty-state-box text-center p-5 w-100" style="padding: 48px 24px; background: #faf8f5; border-radius: 12px; border: 1px dashed #e2d7c5; margin: 20px 0; text-align: center;">
          <p style="color: #7a633a; font-size: 15px; font-weight: 500; margin: 0;">No latest news published yet. Add latest news from the Admin Panel to display them here.</p>
        </div>
      `;
      return;
    }

    // Limit homepage initial layout to MAX 9 cards (3 columns x 3 rows)
    const homepageDynamic = filteredDynamic.slice(0, 9);

    const col0 = homepageDynamic.filter((_, i) => i % 3 === 0);
    const col1 = homepageDynamic.filter((_, i) => i % 3 === 1);
    const col2 = homepageDynamic.filter((_, i) => i % 3 === 2);

    const finalColumns = [col0, col1, col2];

    latestNewsGrid.innerHTML = `
      <div class="news-masonry-grid">
        ${finalColumns.map((colItems, colIndex) => `
          <div class="news-masonry-col">
            ${colItems.map((item, itemIdx) => createNewsCardHTML(item, colIndex + itemIdx * 3)).join('')}

            ${colIndex === 1 ? `
              <div class="view-more-container text-center">
                <button class="btn-secondary" id="viewMoreBtn">View More Updates</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    // View More Updates Button Click Listener
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    if (viewMoreBtn) {
      viewMoreBtn.onclick = (e) => {
        e.preventDefault();
        const courtTitle = courtFilter === 'high-court' 
          ? 'High Court' 
          : (courtFilter === 'sessions-court' ? 'Sessions Court' : 'Supreme Court');
        const courtDesc = courtFilter === 'high-court'
          ? 'Comprehensive updates and judgments from High Courts across India.'
          : (courtFilter === 'sessions-court' ? 'Latest trial court proceedings and Sessions Court verdicts.' : 'The most important legal developments in the Supreme Court shaping India today.');
        
        openCategoryView(`${courtTitle} Updates`, courtDesc);
      };
    }
  }

  window.renderLatestNewsSection = renderLatestNewsSection;

  // Initial Home Page Latest News Grid Render
  renderLatestNewsSection('supreme-court');

  // Filter Tabs Handler (SUPREME COURT, HIGH COURT, SESSIONS COURT)
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const selectedCourt = button.dataset.court || 'supreme-court';
      renderLatestNewsSection(selectedCourt);
    });
  });

  // Pagination Controls
  pageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pageButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Table of Contents Smooth Scroll Listener
  tocItems.forEach(item => {
    item.addEventListener('click', () => {
      tocItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const targetId = item.dataset.target;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Hero Navigation Arrow Controls
  if (prevArticleBtn) {
    prevArticleBtn.addEventListener('click', () => {
      showView('article', true);
    });
  }

  if (nextArticleBtn) {
    nextArticleBtn.addEventListener('click', () => {
      showView('article', true);
    });
  }

  // Newsletter Form Submissions
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        const email = input.value;
        alert(`Thank you for subscribing to Lokal Adalat! Legal briefings will be sent to ${email}.`);
        input.value = '';
      }
    });
  });

  /**
   * Dynamic renderer for the Articles to Read section on the Home page.
   */
  function renderArticlesToReadSection() {
    const container = document.querySelector('#articles-to-read-sec .articles-grid');
    if (!container) return;

    const allArticles = getCollection('articles');
    const publishedArticles = (allArticles || []).filter(a => 
      a.status === 'published' && (!a.targetSection || a.targetSection === 'articles-to-read-sec')
    );

    if (!publishedArticles || publishedArticles.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box text-center p-5 w-100" style="grid-column: 1 / -1; padding: 48px 24px; background: #faf8f5; border-radius: 12px; border: 1px dashed #e2d7c5; margin: 20px 0; text-align: center;">
          <p style="color: #7a633a; font-size: 15px; font-weight: 500; margin: 0;">No articles published yet. Publish articles from the Admin Panel to display them here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = publishedArticles.map(item => `
      <article class="article-card blog-click" data-id="${item.id}">
        <div class="article-thumb">
          <img src="${formatMediaUrl(item.image || item.featured_image || 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80')}" alt="${item.title}" loading="lazy">
        </div>
        <div class="article-body">
          <h3 class="article-title"><a href="#" class="blog-click" data-id="${item.id}">${item.title}</a></h3>
          <p class="article-excerpt">${item.excerpt || ''}</p>
          <div class="article-meta">
            <span>${item.author || 'Editorial Desk'}</span>
            <span>${item.readTime || '5 min read'}</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  // Initial render & reactive storage listener
  renderArticlesToReadSection();
  renderTopStoriesSection();
  renderLatestNewsSection(activeLatestNewsCourtFilter);
  subscribeDataChange(() => {
    renderArticlesToReadSection();
    renderTopStoriesSection();
    renderLatestNewsSection(activeLatestNewsCourtFilter);
  });

  /**
   * Dynamic renderer for Top Stories section on the Home page from appState / MySQL.
   */
  function renderTopStoriesSection() {
    const gridContainer = document.querySelector('#top-stories-sec .top-stories-grid');
    if (!gridContainer) return;

    const allArticles = getCollection('articles');
    const topStoriesArticles = (allArticles || []).filter(a => 
      a.status === 'published' && a.targetSection === 'top-stories-sec'
    );

    if (!topStoriesArticles || topStoriesArticles.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state-box text-center p-5 w-100" style="grid-column: 1 / -1; padding: 48px 24px; background: #faf8f5; border-radius: 12px; border: 1px dashed #e2d7c5; margin: 20px 0; text-align: center;">
          <p style="color: #7a633a; font-size: 15px; font-weight: 500; margin: 0;">No top stories published yet. Add top stories from the Admin Panel to display them here.</p>
        </div>
      `;
      return;
    }

    const items = topStoriesArticles.slice(0, 5);
    const heroItem = items[0];
    const leftItems = items.slice(1, 3);
    const rightItems = items.slice(3, 5);

    const formatCard = (item) => {
      const court = item.court || 'SUPREME COURT';
      const tagClass = court.toUpperCase().includes('HIGH') ? 'tag-high-court' : (court.toUpperCase().includes('SESSIONS') ? 'tag-sessions-court' : 'tag-supreme-court');
      return `
        <article class="news-card card-compact blog-click" data-id="${item.id}">
          <div class="card-image-wrapper">
            <img src="${formatMediaUrl(item.image || item.featured_image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80')}" alt="${item.title}" loading="lazy">
            <span class="court-tag ${tagClass}">${court}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title"><a href="#" class="blog-click" data-id="${item.id}">${item.title}</a></h3>
            <p class="card-meta">${item.publishDate || '17 July 2025'} · ${item.readTime || '5 min read'}</p>
          </div>
        </article>
      `;
    };

    const heroCourt = heroItem.court || 'SUPREME COURT';
    const heroTagClass = heroCourt.toUpperCase().includes('HIGH') ? 'tag-high-court' : (heroCourt.toUpperCase().includes('SESSIONS') ? 'tag-sessions-court' : 'tag-supreme-court');

    gridContainer.innerHTML = `
      <div class="grid-col left-col">
        ${leftItems.map(item => formatCard(item)).join('')}
      </div>
      <div class="grid-col middle-col">
        <article class="news-card card-hero blog-click" data-id="${heroItem.id}">
          <div class="hero-image-wrapper">
            <img src="${formatMediaUrl(heroItem.image || heroItem.featured_image || '/images/supreme-court.jpg')}" alt="${heroItem.title}" loading="lazy">
            <div class="hero-overlay"></div>
            <span class="court-tag ${heroTagClass} hero-tag">${heroCourt}</span>
            <div class="hero-content">
              <h3 class="hero-title"><a href="#" class="blog-click" data-id="${heroItem.id}">${heroItem.title}</a></h3>
              <p class="hero-meta">${heroItem.publishDate || '17 July 2025'} · ${heroItem.readTime || '8 min read'}</p>
            </div>
          </div>
        </article>
      </div>
      <div class="grid-col right-col">
        ${rightItems.map(item => formatCard(item)).join('')}
      </div>
    `;
  }

  // ==========================================================================
  // MOBILE SLIDER & MOBILE BOTTOM BAR CONTROLS
  // ==========================================================================

  function initMobileSlider() {
    const sliderTrack = document.getElementById('mobileSliderTrack');
    const dots = document.querySelectorAll('#mobileSliderDots .dot');
    if (!sliderTrack) return;

    let currentIndex = 0;
    const cards = sliderTrack.querySelectorAll('.mobile-slider-card');
    const totalCards = cards.length;

    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;

    function setSliderPosition() {
      sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
    }

    function updateDots() {
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    function goToSlide(index) {
      if (index < 0) index = 0;
      if (index >= totalCards) index = totalCards - 1;
      currentIndex = index;
      const cardWidth = sliderTrack.parentElement?.clientWidth || window.innerWidth;
      currentTranslate = -currentIndex * cardWidth;
      prevTranslate = currentTranslate;
      sliderTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
      setSliderPosition();
      updateDots();
    }

    // Touch Event Listeners
    sliderTrack.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      sliderTrack.style.transition = 'none';
    }, { passive: true });

    sliderTrack.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      currentTranslate = prevTranslate + diffX;
      setSliderPosition();
    }, { passive: true });

    sliderTrack.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -50 && currentIndex < totalCards - 1) {
        currentIndex += 1;
      } else if (movedBy > 50 && currentIndex > 0) {
        currentIndex -= 1;
      }
      goToSlide(currentIndex);
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => goToSlide(idx));
    });
  }

  // ==========================================================================
  // MOBILE CATEGORY VERTICAL CARD FEED CONTROLLER (Reference Images 1, 2, 3)
  // ==========================================================================
  function initMobileCategoryFeed() {
    const feedTrack = document.getElementById('mobileFeedTrack');
    const filterPills = document.querySelectorAll('.mobile-cat-pill');
    const verticalFeedContainer = document.getElementById('mobileVerticalFeed');
    if (!feedTrack || !verticalFeedContainer) return;

    let currentCourtFilter = 'Supreme Court';
    let currentSlideIndex = 0;
    let startY = 0;
    let currentTranslateY = 0;
    let prevTranslateY = 0;
    let isDragging = false;
    let isWheeling = false;

    function getFilteredArticles(courtName) {
      if (!categoryArticlesList || categoryArticlesList.length === 0) return [];
      const normalized = (courtName || '').toUpperCase().trim();
      if (normalized.includes('SUPREME')) {
        return categoryArticlesList.filter(item => (item.court || '').includes('SUPREME'));
      } else if (normalized.includes('HIGH')) {
        return categoryArticlesList.filter(item => (item.court || '').includes('HIGH'));
      } else if (normalized.includes('SESSIONS')) {
        return categoryArticlesList.filter(item => (item.court || '').includes('SESSIONS'));
      }
      return categoryArticlesList;
    }

    function renderFeedSlides(courtName) {
      currentCourtFilter = courtName || 'Supreme Court';
      const articles = getFilteredArticles(currentCourtFilter);

      // Render cards + Footer slide as last item
      const cardsHTML = articles.map((item, idx) => {
        const courtTag = item.court || 'SUPREME COURT';
        const tagClass = courtTag.toUpperCase().includes('HIGH') 
          ? 'tag-high-court' 
          : courtTag.toUpperCase().includes('SESSIONS') 
            ? 'tag-sessions-court' 
            : 'tag-supreme-court';

        return `
          <div class="mobile-feed-slide ${idx === 0 ? 'active-slide' : ''}" data-index="${idx}">
            <div class="mobile-feed-card blog-click" data-id="${item.id || ''}">
              <div class="mobile-feed-bg-wrap">
                <img src="${item.image || '/images/supreme-court.jpg'}" alt="${item.title || 'Legal News'}" loading="lazy">
                <div class="mobile-feed-overlay"></div>
                <span class="court-tag ${tagClass}">${courtTag}</span>
                <div class="mobile-feed-card-content">
                  <h3 class="mobile-feed-card-title">${item.title}</h3>
                  <p class="mobile-feed-card-meta">${item.date || '17 July 2025'} · ${item.readTime || '5 min read'}</p>
                  <p class="mobile-feed-card-excerpt">${item.excerpt || ''}</p>
                  <div class="mobile-feed-card-footer">
                    <button class="btn-share-icon" aria-label="Share article">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                    </button>
                    <button class="btn-read-full blog-click" data-id="${item.id || ''}">
                      Read Full Story <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      feedTrack.innerHTML = cardsHTML;

      // Update Filter Pill Active state
      filterPills.forEach(pill => {
        const courtAttr = pill.dataset.court || pill.textContent.trim();
        pill.classList.toggle('active', courtAttr.toUpperCase().includes(currentCourtFilter.toUpperCase()));
      });

      requestAnimationFrame(() => {
        goToFeedSlide(0, false);
      });
    }

    function goToFeedSlide(index, animate = true) {
      const slides = feedTrack.querySelectorAll('.mobile-feed-slide');
      const totalSlides = slides.length;
      if (index < 0) index = 0;
      if (index >= totalSlides) index = totalSlides - 1;

      currentSlideIndex = index;
      const slideHeight = verticalFeedContainer.getBoundingClientRect().height || verticalFeedContainer.clientHeight || 540;
      currentTranslateY = -currentSlideIndex * slideHeight;
      prevTranslateY = currentTranslateY;

      if (animate) {
        feedTrack.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
      } else {
        feedTrack.style.transition = 'none';
      }

      feedTrack.style.transform = `translateY(${currentTranslateY}px)`;

      // Toggle active-slide class for entry scale/blur effect
      slides.forEach((slide, idx) => {
        slide.classList.toggle('active-slide', idx === currentSlideIndex);
      });
    }

    // Touch Event Listeners for Vertical Drag/Swipe
    verticalFeedContainer.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      feedTrack.style.transition = 'none';
    }, { passive: true });

    verticalFeedContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      currentTranslateY = prevTranslateY + diffY;
      feedTrack.style.transform = `translateY(${currentTranslateY}px)`;
    }, { passive: true });

    verticalFeedContainer.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const movedBy = currentTranslateY - prevTranslateY;
      const slides = feedTrack.querySelectorAll('.mobile-feed-slide');
      if (movedBy < -50 && currentSlideIndex < slides.length - 1) {
        currentSlideIndex += 1;
      } else if (movedBy > 50 && currentSlideIndex > 0) {
        currentSlideIndex -= 1;
      }
      goToFeedSlide(currentSlideIndex, true);
    });

    // Mouse Wheel / Touchpad scroll event lock
    verticalFeedContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (isWheeling) return;
      isWheeling = true;

      const slides = feedTrack.querySelectorAll('.mobile-feed-slide');
      if (e.deltaY > 20 && currentSlideIndex < slides.length - 1) {
        currentSlideIndex += 1;
        goToFeedSlide(currentSlideIndex, true);
      } else if (e.deltaY < -20 && currentSlideIndex > 0) {
        currentSlideIndex -= 1;
        goToFeedSlide(currentSlideIndex, true);
      }

      setTimeout(() => {
        isWheeling = false;
      }, 500);
    }, { passive: false });

    // Filter Pills Click Handlers
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const courtName = pill.dataset.court || pill.textContent.trim();
        renderFeedSlides(courtName);
      });
    });

    // Expose global render function for router integration
    window.renderMobileCategoryFeed = (courtName) => {
      renderFeedSlides(courtName || 'Supreme Court');
    };

    // Initial render
    renderFeedSlides('Supreme Court');
  }

  function initMobileBottomNav() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    if (!mobileNavItems.length) return;

    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        if (item.id === 'mobileNavCourts') {
          openCategoryView('Supreme Court', 'The most important legal developments shaping India today.');
          return;
        }

        if (item.id === 'mobileNavVideos') {
          openVideoReelsView(0);
          return;
        }

        if (item.id === 'mobileNavArticles') {
          openMobileArticlesView();
          return;
        }

        const targetSecId = item.dataset.target;

        // Show home view if not currently on home view
        showView('home', false);

        if (targetSecId) {
          const targetSec = document.getElementById(targetSecId);
          if (targetSec) {
            targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    // Update active nav item based on scroll position
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 200;
      const sections = [
        { id: 'top-stories-sec', btn: document.getElementById('mobileNavHome') },
        { id: 'latest-news-sec', btn: document.getElementById('mobileNavCourts') },
        { id: 'video-corner-sec', btn: document.getElementById('mobileNavVideos') },
        { id: 'articles-sec', btn: document.getElementById('mobileNavArticles') }
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const secElem = document.getElementById(sections[i].id);
        if (secElem && secElem.offsetTop <= scrollPos) {
          mobileNavItems.forEach(n => n.classList.remove('active'));
          if (sections[i].btn) sections[i].btn.classList.add('active');
          break;
        }
      }
    }, { passive: true });
  }

  // ==========================================================================
  // MOBILE VIDEO REELS CONTROLLER (INSTAGRAM REELS STYLE)
  // ==========================================================================
  function initMobileVideoReels() {
    const reelsTrack = document.getElementById('mobileReelsTrack');
    const reelsContainer = document.getElementById('mobileReelsContainer');
    const shareOverlay = document.getElementById('reelShareOverlay');
    const btnCloseShare = document.getElementById('btnCloseShare');
    const btnCopyReelLink = document.getElementById('btnCopyReelLink');
    if (!reelsTrack || !reelsContainer) return;

    let currentReelIndex = 0;
    let startY = 0;
    let currentTranslateY = 0;
    let prevTranslateY = 0;
    let isDragging = false;
    let isWheeling = false;
    let isMuted = false;

    function renderReels() {
      const videoList = getCollection('videos');
      if (!videoList || !videoList.length) return;

      reelsTrack.innerHTML = videoList.map((item, idx) => `
        <div class="reel-slide ${idx === 0 ? 'active-reel' : ''}" data-index="${idx}">
          <div class="reel-card">
            <div class="reel-media-wrap">
              <img src="${formatMediaUrl(item.posterImage || item.image || '/images/supreme-court.jpg')}" alt="${item.title}" class="reel-poster" loading="lazy">
              <video class="reel-video" loop playsinline preload="metadata" src="${formatMediaUrl(item.videoUrl || '')}"></video>
              <div class="reel-overlay"></div>
            </div>

            <!-- Top Accent Progress Bar -->
            <div class="reel-top-progress-bar">
              <div class="reel-progress-fill"></div>
            </div>

            <!-- Header Overlay -->
            <div class="reel-header-overlay">
              <div class="reel-logo">
                <span class="hindi-logo">लोक अदालत</span> <span class="english-logo">LOKAL ADALAT</span>
              </div>
              <button class="reel-audio-btn" aria-label="Toggle Audio">
                <svg class="icon-unmuted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <svg class="icon-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                </svg>
              </button>
            </div>

            <!-- Center Gold Play Button -->
            <button class="reel-center-play-btn" aria-label="Toggle Play">
              <svg class="play-svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>

            <!-- Right Side Progress Indicators -->
            <div class="reel-side-indicators">
              <span class="reel-dash active"></span>
              <span class="reel-dash"></span>
              <span class="reel-dash"></span>
            </div>

            <!-- Bottom Information Overlay -->
            <div class="reel-bottom-content">
              <h3 class="reel-title">${item.title}</h3>
              <p class="reel-excerpt collapsed">${item.excerpt || ''}</p>
              <button class="reel-toggle-more">View More ˅</button>
              <div class="reel-swipe-hint">
                Swipe up for next briefing ˅
              </div>
            </div>

            <!-- Right Action Bar -->
            <div class="reel-right-actions">
              <button class="reel-action-btn btn-trigger-share" aria-label="Share Briefing">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');

      attachReelCardEvents();
      goToReelSlide(0, false);
    }

    function goToReelSlide(index, animate = true) {
      const slides = reelsTrack.querySelectorAll('.reel-slide');
      const totalSlides = slides.length;
      if (index < 0) index = 0;
      if (index >= totalSlides) index = totalSlides - 1;

      currentReelIndex = index;
      const slideHeight = reelsContainer.getBoundingClientRect().height || reelsContainer.clientHeight || 600;
      currentTranslateY = -currentReelIndex * slideHeight;
      prevTranslateY = currentTranslateY;

      if (animate) {
        reelsTrack.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
      } else {
        reelsTrack.style.transition = 'none';
      }

      reelsTrack.style.transform = `translateY(${currentTranslateY}px)`;

      slides.forEach((slide, idx) => {
        const isActive = (idx === currentReelIndex);
        slide.classList.toggle('active-reel', isActive);
        const video = slide.querySelector('.reel-video');
        if (video) {
          if (isActive) {
            video.currentTime = 0;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      });
    }

    function attachReelCardEvents() {
      // Toggle Audio Button
      reelsTrack.querySelectorAll('.reel-audio-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          isMuted = !isMuted;
          reelsTrack.querySelectorAll('.reel-video').forEach(vid => vid.muted = isMuted);
          reelsTrack.querySelectorAll('.reel-audio-btn').forEach(b => {
            b.querySelector('.icon-unmuted').style.display = isMuted ? 'none' : 'block';
            b.querySelector('.icon-muted').style.display = isMuted ? 'block' : 'none';
          });
        });
      });

      // Toggle Play Button
      reelsTrack.querySelectorAll('.reel-center-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const activeSlide = reelsTrack.querySelectorAll('.reel-slide')[currentReelIndex];
          if (!activeSlide) return;
          const video = activeSlide.querySelector('.reel-video');
          if (video) {
            if (video.paused) {
              video.play();
              btn.style.opacity = '0';
            } else {
              video.pause();
              btn.style.opacity = '1';
            }
          }
        });
      });

    const sheetOverlay = document.getElementById('reelDetailsSheetOverlay');
    const sheetCourtTag = document.getElementById('sheetCourtTag');
    const sheetTitle = document.getElementById('sheetTitle');
    const sheetMeta = document.getElementById('sheetMeta');
    const sheetBodyParagraphs = document.getElementById('sheetBodyParagraphs');
    const btnCloseSheet = document.getElementById('btnCloseSheet');

    function closeSheet() {
      if (sheetOverlay) {
        sheetOverlay.classList.remove('open');
        setTimeout(() => {
          sheetOverlay.style.display = 'none';
        }, 300);
      }
    }

    // View More button opens full bottom sheet modal matching reference image
    reelsTrack.querySelectorAll('.reel-toggle-more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dynamicVideoList = getCollection('videos');
        const item = dynamicVideoList[currentReelIndex] || dynamicVideoList[0];
        if (item && sheetOverlay) {
          if (sheetCourtTag) {
            const courtName = item.court || 'SUPREME COURT';
            sheetCourtTag.textContent = courtName;
            const courtUpper = courtName.toUpperCase();
            sheetCourtTag.className = 'court-tag ' + (courtUpper.includes('HIGH') ? 'tag-high-court' : courtUpper.includes('SESSIONS') ? 'tag-sessions-court' : 'tag-supreme-court');
          }
          if (sheetTitle) sheetTitle.textContent = item.title;
          if (sheetMeta) sheetMeta.textContent = `Published on ${item.publishedDate || item.date || '16 July 2026'} · ${item.duration || item.readTime || '1 min 48 sec'}`;
          if (sheetBodyParagraphs) {
            const paragraphs = item.fullStoryParagraphs || [item.excerpt || ''];
            sheetBodyParagraphs.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
          }
          sheetOverlay.style.display = 'flex';
          requestAnimationFrame(() => {
            sheetOverlay.classList.add('open');
          });
        }
      });
    });

    if (btnCloseSheet) {
      btnCloseSheet.addEventListener('click', closeSheet);
    }

    if (sheetOverlay) {
      sheetOverlay.addEventListener('click', (e) => {
        if (e.target === sheetOverlay || e.target.classList.contains('sheet-drag-handle-bar') || e.target.classList.contains('sheet-drag-handle')) {
          closeSheet();
        }
      });
    }

    // Share button popup trigger
    reelsTrack.querySelectorAll('.btn-trigger-share').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (shareOverlay) shareOverlay.style.display = 'flex';
      });
    });
  }

  if (btnCloseShare) {
    btnCloseShare.addEventListener('click', () => {
      if (shareOverlay) shareOverlay.style.display = 'none';
    });
  }

  if (shareOverlay) {
    shareOverlay.addEventListener('click', (e) => {
      if (e.target === shareOverlay) shareOverlay.style.display = 'none';
    });
  }

  if (btnCopyReelLink) {
    btnCopyReelLink.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      const textSpan = btnCopyReelLink.querySelector('span');
      if (textSpan) {
        const orig = textSpan.textContent;
        textSpan.textContent = 'Copied!';
        setTimeout(() => textSpan.textContent = orig, 1800);
      }
    });
  }

    // Touch events for vertical reel swipe
    reelsContainer.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      reelsTrack.style.transition = 'none';
    }, { passive: true });

    reelsContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      currentTranslateY = prevTranslateY + diffY;
      reelsTrack.style.transform = `translateY(${currentTranslateY}px)`;
    }, { passive: true });

    reelsContainer.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const movedBy = currentTranslateY - prevTranslateY;
      const slides = reelsTrack.querySelectorAll('.reel-slide');
      if (movedBy < -50 && currentReelIndex < slides.length - 1) {
        currentReelIndex += 1;
      } else if (movedBy > 50 && currentReelIndex > 0) {
        currentReelIndex -= 1;
      }
      goToReelSlide(currentReelIndex, true);
    });

    // Mouse wheel lock for reels
    reelsContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (isWheeling) return;
      isWheeling = true;

      const slides = reelsTrack.querySelectorAll('.reel-slide');
      if (e.deltaY > 20 && currentReelIndex < slides.length - 1) {
        currentReelIndex += 1;
        goToReelSlide(currentReelIndex, true);
      } else if (e.deltaY < -20 && currentReelIndex > 0) {
        currentReelIndex -= 1;
        goToReelSlide(currentReelIndex, true);
      }

      setTimeout(() => { isWheeling = false; }, 500);
    }, { passive: false });

    // Expose global render method
    window.renderMobileVideoReels = (index = 0) => {
      renderReels();
      requestAnimationFrame(() => {
        goToReelSlide(index, false);
      });
    };

    renderReels();
  }

  // Attach click listener for Video Corner cards on mobile
  document.addEventListener('click', (e) => {
    const videoCornerCard = e.target.closest('#video-corner-sec .playlist-card, #video-corner-sec .main-video-card');
    if (videoCornerCard && window.innerWidth <= 768) {
      e.preventDefault();
      openVideoReelsView(0);
    }
  });

  // ==========================================================================
  // MOBILE ARTICLES TO READ VIEW CONTROLLER (Reference Images 1 & 2)
  // ==========================================================================
  function initMobileArticlesView() {
    const listElem = document.getElementById('mobileArticlesList');
    if (!listElem) return;

    function renderArticles() {
      const storedArticles = getCollection('articles');
      let itemsToRender = (storedArticles || []).filter(a => a.status !== 'archived');
      itemsToRender = itemsToRender.filter(a => !a.targetSection || a.targetSection === 'articles-to-read-sec');
      if (!itemsToRender || !itemsToRender.length) return;

      listElem.innerHTML = itemsToRender.map(item => `
        <article class="mobile-article-card blog-click" data-id="${item.id}">
          <div class="mobile-article-image-wrap">
            <img src="${item.image}" alt="${item.title}" loading="lazy">
          </div>
          <div class="mobile-article-card-body">
            <h3 class="mobile-article-card-title">${item.title}</h3>
            <p class="mobile-article-card-excerpt">${item.excerpt}</p>
            <div class="mobile-article-card-footer">
              <span class="mobile-article-author">${item.author || 'Editorial Desk'}</span>
              <span class="mobile-article-readtime">${item.readTime || '8 min read'}</span>
              <button class="mobile-article-read-btn blog-click" data-id="${item.id}">
                Read More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }

    window.renderMobileArticlesView = () => {
      renderArticles();
    };

    subscribeDataChange(() => {
      renderArticles();
    });

    renderArticles();
  }

  // ==========================================================================
  // FLOATING VIDEO PLAYER CONTROLLER (IntersectionObserver & Seamless PiP)
  // ==========================================================================
  function initFloatingVideoPlayer() {
    const videoSection = document.getElementById('video-corner-sec');
    const featuredCard = document.getElementById('featuredVideoCard');
    const videoElem = document.getElementById('mainVideoPlayer');
    const playBtn = document.getElementById('mainVideoPlayBtn');
    const playIcon = document.getElementById('mainVideoPlayIcon');
    const closeBtn = document.getElementById('floatingVideoCloseBtn');

    if (!videoSection || !featuredCard || !videoElem) return;

    let isClosedManually = false;
    let isFloating = false;
    let hasAttemptedAutoplay = false;

    // Toggle Play / Pause
    function togglePlay() {
      if (videoElem.paused) {
        videoElem.play().then(() => {
          updatePlayBtnIcon(true);
        }).catch(err => {
          console.log('Autoplay blocked by browser policy:', err);
        });
      } else {
        videoElem.pause();
        updatePlayBtnIcon(false);
      }
    }

    function updatePlayBtnIcon(isPlaying) {
      if (!playIcon) return;
      if (isPlaying) {
        playIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
      } else {
        playIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
      }
    }

    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    if (featuredCard) {
      featuredCard.addEventListener('click', (e) => {
        if (e.target.closest('#floatingVideoCloseBtn')) return;
        togglePlay();
      });
    }

    // Close Floating Video
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isClosedManually = true;
        videoElem.pause();
        updatePlayBtnIcon(false);
        featuredCard.classList.remove('is-floating');
        isFloating = false;
      });
    }

    let transitionTimer = null;
    function setFloatingState(shouldFloat) {
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        if (shouldFloat && !isFloating) {
          featuredCard.classList.add('is-floating');
          isFloating = true;
        } else if (!shouldFloat && isFloating) {
          featuredCard.classList.remove('is-floating');
          isFloating = false;
        }
      }, 60);
    }

    // IntersectionObserver to detect when video-corner-sec enters/leaves viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Desktop / Large screen check or all viewports where section exists
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          // Section in viewport (45%+ visible)
          if (isClosedManually) {
            // Reset manual close when user scrolls back into section
            isClosedManually = false;
          }

          setFloatingState(false);

          // Autoplay muted when first reaching video section
          if (!hasAttemptedAutoplay && videoElem.paused) {
            hasAttemptedAutoplay = true;
            videoElem.muted = true;
            videoElem.play().then(() => {
              updatePlayBtnIcon(true);
            }).catch(() => {});
          }
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.45) {
          // Section scrolled past
          const rect = videoSection.getBoundingClientRect();
          const isBelowSection = rect.bottom < (window.innerHeight * 0.5);

          if (isBelowSection && !videoElem.paused && !isClosedManually) {
            // Transition into floating mini player if video is currently playing
            setFloatingState(true);
          } else if (!isBelowSection) {
            // Above section or video paused
            setFloatingState(false);
          }
        }
      });
    }, {
      threshold: [0.1, 0.45, 0.6]
    });

    observer.observe(videoSection);

    // Synchronize play/pause state icons with native video events
    videoElem.addEventListener('play', () => updatePlayBtnIcon(true));
    videoElem.addEventListener('pause', () => updatePlayBtnIcon(false));
  }

  // ==========================================================================
  // DYNAMIC VIDEO CORNER RENDERER (CMS Connected)
  // ==========================================================================
  function renderVideoCornerSection() {
    const videoElem = document.getElementById('mainVideoPlayer');
    const desktopTitle = document.getElementById('mainVideoDesktopTitle');
    const mobileTitle = document.getElementById('mainVideoMobileTitle');
    const durationTag = document.getElementById('mainVideoDurationTag');
    const dateTag = document.getElementById('mainVideoDateTag');
    const courtTag = document.getElementById('mainVideoCourtTag');
    const playlistContainer = document.getElementById('mobileVideoPlaylist');

    const videoList = getCollection('videos');
    if (!videoList || !videoList.length) {
      if (desktopTitle) desktopTitle.textContent = "No Video Briefings Uploaded Yet";
      if (mobileTitle) mobileTitle.textContent = "No Video Briefings Uploaded Yet";
      if (videoElem) {
        videoElem.removeAttribute('src');
        videoElem.removeAttribute('poster');
        videoElem.load();
      }
      if (durationTag) durationTag.textContent = "";
      if (dateTag) dateTag.textContent = "";
      if (courtTag) courtTag.textContent = "LOKAL ADALAT";
      if (playlistContainer) {
        playlistContainer.innerHTML = `<p style="padding: 24px; color: #7a633a; font-size: 14px; text-align: center; margin: 0;">No video briefings added yet.</p>`;
      }
      return;
    }

    const featuredVideo = videoList[0];

    if (videoElem && featuredVideo) {
      videoElem.innerHTML = '';
      const formattedPoster = formatMediaUrl(featuredVideo.posterImage || featuredVideo.image);
      const formattedSrc = formatMediaUrl(featuredVideo.videoUrl);

      if (formattedPoster) {
        videoElem.poster = formattedPoster;
      }
      if (formattedSrc && videoElem.src !== formattedSrc) {
        videoElem.src = formattedSrc;
        videoElem.load();
      }
    }

    if (desktopTitle && featuredVideo.title) desktopTitle.textContent = featuredVideo.title;
    if (mobileTitle && featuredVideo.title) mobileTitle.textContent = featuredVideo.title;
    if (durationTag && (featuredVideo.duration || featuredVideo.readTime)) durationTag.textContent = featuredVideo.duration || featuredVideo.readTime;
    if (dateTag && (featuredVideo.publishedDate || featuredVideo.date)) dateTag.textContent = featuredVideo.publishedDate || featuredVideo.date;
    if (courtTag && featuredVideo.court) courtTag.textContent = featuredVideo.court;

    // Render playlist items
    if (playlistContainer) {
      const playlistItems = videoList.length > 1 ? videoList.slice(1, 4) : [];
      playlistContainer.innerHTML = playlistItems.map(item => `
        <div class="playlist-item" data-id="${item.id}">
          <div class="playlist-thumb">
            <img src="${formatMediaUrl(item.posterImage || item.image || '/images/courtroom.jpg')}" alt="${item.title}">
            <div class="playlist-card-overlay"></div>
            <button class="play-button-small" aria-label="Play video">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="playlist-content">
            <h4 class="playlist-title"><a href="#" class="blog-click" data-id="${item.id}">${item.title}</a></h4>
            <p class="playlist-meta">${item.duration || item.readTime || '12:00'}</p>
          </div>
        </div>
      `).join('');

      // Click event for playlist items to switch featured video
      playlistContainer.querySelectorAll('.playlist-item').forEach(pItem => {
        pItem.addEventListener('click', (e) => {
          e.preventDefault();
          const selected = videoList.find(v => String(v.id) === String(pItem.dataset.id));
          if (selected && videoElem) {
            videoElem.innerHTML = '';
            const selPoster = formatMediaUrl(selected.posterImage || selected.image);
            const selSrc = formatMediaUrl(selected.videoUrl);
            if (selPoster) videoElem.poster = selPoster;
            if (selSrc) {
              videoElem.src = selSrc;
              videoElem.load();
              videoElem.play().catch(() => {});
            }
            if (desktopTitle) desktopTitle.textContent = selected.title;
            if (mobileTitle) mobileTitle.textContent = selected.title;
            if (durationTag) durationTag.textContent = selected.duration || selected.readTime;
            if (dateTag) dateTag.textContent = selected.publishedDate || selected.date;
            if (courtTag) courtTag.textContent = selected.court || 'SUPREME COURT';
          }
        });
      });
    }
  }

  // Subscribe to storage changes to re-render Latest News, Video Corner & Articles dynamically
  subscribeDataChange(() => {
    if (typeof activeLatestNewsCourtFilter !== 'undefined') {
      renderLatestNewsSection(activeLatestNewsCourtFilter);
    } else {
      renderLatestNewsSection('supreme-court');
    }
    renderVideoCornerSection();
  });

  renderVideoCornerSection();

  initMobileSlider();
  initMobileCategoryFeed();
  initMobileVideoReels();
  initMobileArticlesView();
  initMobileBottomNav();
  initFloatingVideoPlayer();

  // ==========================================================================
  // SINGLE ARTICLE DETAIL VIEW RENDERER (Dynamic TOC & Working Share Buttons)
  // ==========================================================================
  function renderArticleDetail(articleOrId) {
    const articleView = document.getElementById('articleView');
    if (!articleView) return;

    let article = null;
    if (typeof articleOrId === 'object' && articleOrId !== null) {
      article = articleOrId;
    } else if (articleOrId) {
      const allArticles = getCollection('articles');
      article = (allArticles || []).find(a => String(a.id) === String(articleOrId));
    }

    if (!article) {
      const allArticles = getCollection('articles');
      article = (allArticles && allArticles.length) ? allArticles[0] : null;
    }

    if (!article) return;

    // Header Details
    const titleElem = articleView.querySelector('.hero-article-title');
    const subtitleElem = articleView.querySelector('.hero-article-subtitle');
    const tagElem = articleView.querySelector('.hero-tag-row .court-tag');
    const dateElem = articleView.querySelector('.hero-article-date');
    const metaElem = articleView.querySelector('.hero-article-meta-row');
    const imgElem = articleView.querySelector('.hero-article-img');

    if (titleElem) titleElem.textContent = article.title || '';
    if (subtitleElem) subtitleElem.textContent = article.excerpt || article.seoDescription || '';
    if (dateElem) dateElem.textContent = article.publishDate || article.date || '18 July 2025';

    if (tagElem) {
      const courtName = article.court || 'SUPREME COURT';
      tagElem.textContent = courtName;
      const tagClass = courtName.toUpperCase().includes('HIGH') ? 'tag-high-court' : (courtName.toUpperCase().includes('SESSIONS') ? 'tag-sessions-court' : 'tag-supreme-court');
      tagElem.className = `court-tag ${tagClass}`;
    }

    if (metaElem) {
      metaElem.innerHTML = `
        <span class="meta-item">${article.readTime || '8 min read'}</span>
        <span class="dot-sep">•</span>
        <span class="meta-item">Author: ${article.author || 'Editorial Desk'}</span>
      `;
    }

    if (imgElem) {
      imgElem.src = formatMediaUrl(article.image || article.featured_image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80');
      imgElem.alt = article.title || 'Article Image';
    }

    // Prepare Sections (Title & Content pair)
    let sections = article.sections || article.paragraphs;
    if (typeof sections === 'string' && sections.startsWith('[')) {
      try { sections = JSON.parse(sections); } catch(e) { sections = null; }
    }

    let normalizedSections = [];
    if (Array.isArray(sections) && sections.length > 0) {
      if (typeof sections[0] === 'object' && sections[0] !== null && sections[0].title) {
        normalizedSections = sections;
      } else {
        const defaultTitles = [
          "01 Introduction",
          "02 Background of the Case",
          "03 Constitutional Questions",
          "04 Key Arguments Presented",
          "05 Key Observations",
          "06 Implications for Digital Rights",
          "07 What Happens Next?"
        ];
        normalizedSections = sections.map((contentStr, idx) => ({
          title: defaultTitles[idx] || `Section ${idx + 1}`,
          content: typeof contentStr === 'string' ? contentStr : (contentStr.content || '')
        }));
      }
    }

    if (!normalizedSections || !normalizedSections.length) {
      normalizedSections = [
        { title: "01 Introduction", content: article.excerpt || article.body || "Article content details..." }
      ];
    }

    // Render TOC Sidebar
    const tocListElem = document.getElementById('tocList');
    const tocFooterElem = articleView.querySelector('.toc-footer');
    if (tocListElem) {
      tocListElem.innerHTML = normalizedSections.map((sec, idx) => {
        const titleText = sec.title || `Section ${idx + 1}`;
        const match = titleText.match(/^(\d{2}|\d+)\s*(.*)/);
        const numStr = match ? match[1].padStart(2, '0') : (idx + 1).toString().padStart(2, '0');
        const textStr = match ? match[2] : titleText;
        const sectionId = `sec-art-${idx + 1}`;

        return `
          <li class="toc-item ${idx === 0 ? 'active' : ''}" data-target="${sectionId}">
            <span class="toc-num">${numStr}</span> ${textStr}
          </li>
        `;
      }).join('');

      if (tocFooterElem) {
        tocFooterElem.textContent = `1 / ${normalizedSections.length} sections`;
      }

      tocListElem.querySelectorAll('.toc-item').forEach((item, index) => {
        item.addEventListener('click', () => {
          tocListElem.querySelectorAll('.toc-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          if (tocFooterElem) tocFooterElem.textContent = `${index + 1} / ${normalizedSections.length} sections`;

          const targetId = item.dataset.target;
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }

    // Render Main Article Body (Unique text per section, no fallback loops)
    const bodyContentElem = articleView.querySelector('.article-content-main');
    if (bodyContentElem) {
      bodyContentElem.innerHTML = normalizedSections.map((sec, idx) => {
        const titleText = sec.title || `Section ${idx + 1}`;
        const match = titleText.match(/^(\d{2}|\d+)\s*(.*)/);
        const headingText = match ? match[2] : titleText;
        const sectionId = `sec-art-${idx + 1}`;
        const pText = sec.content || '';

        return `
          <section id="${sectionId}" class="article-section">
            ${idx === 0 ? `
              <p class="lead-paragraph">${pText}</p>
            ` : `
              <h2 class="article-heading">${headingText}</h2>
              <p>${pText}</p>
            `}
          </section>
        `;
      }).join('');
    }

    // Share buttons functionality
    const shareContainer = articleView.querySelector('.hero-share-row');
    if (shareContainer) {
      const pageUrl = window.location.href;
      const shareTitle = encodeURIComponent(article.title || 'Lokal Adalat Article');
      const shareUrl = encodeURIComponent(pageUrl);

      shareContainer.querySelectorAll('.share-btn').forEach(btn => {
        const label = (btn.getAttribute('aria-label') || btn.textContent).toLowerCase();
        btn.onclick = (e) => {
          e.preventDefault();
          if (label.includes('linkedin') || btn.textContent === 'in') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
          } else if (label.includes('x') || btn.textContent.includes('𝕏') || btn.textContent === 'x') {
            window.open(`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`, '_blank');
          } else if (label.includes('facebook') || btn.textContent === 'f') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
          } else if (label.includes('comment') || label.includes('whatsapp') || btn.textContent === '💬') {
            window.open(`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`, '_blank');
          } else if (label.includes('copy') || btn.textContent === '🔗') {
            navigator.clipboard.writeText(pageUrl);
            const orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = orig; }, 1800);
          }
        };
      });
    }
  }

  window.renderArticleDetail = renderArticleDetail;
});
