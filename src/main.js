/**
 * @file main.js
 * @description Main application initializer for Lokal Adalat web platform.
 */

import { defaultTopStories, defaultLatestNews, defaultVideos, defaultArticlesToRead, categoryArticlesList } from './js/data.js';
import { createNewsCardHTML } from './js/components.js';
import { initRouter, openCategoryView, openVideoListingView, openVideoReelsView, openMobileArticlesView, showView } from './js/router.js';
import { initDrawer } from './js/drawer.js';
import { initSearch } from './js/search.js';

import { initAdminStorage, subscribeDataChange, getCollection, addSubscriber } from './js/adminStorage.js';
import { initAdminUI } from './js/adminUI.js';
import { formatMediaUrl } from './js/apiClient.js';
import { showToast } from './js/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ==========================================================================
  // GLOBAL MEDIA CONTROLLER — Ensures only one audio/video source plays at a time
  // ==========================================================================
  function pauseAllMedia(exceptElement) {
    // Pause ALL native <video> elements
    document.querySelectorAll('video').forEach(v => {
      if (v !== exceptElement) {
        try {
          v.pause();
          v.muted = true;
        } catch(e) {}
      }
    });
    // Pause ALL native <audio> elements
    document.querySelectorAll('audio').forEach(a => {
      if (a !== exceptElement) {
        try { a.pause(); } catch(e) {}
      }
    });
    // Pause ALL YouTube iframes
    document.querySelectorAll('iframe').forEach(f => {
      if (f !== exceptElement) {
        try {
          f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch(e) {}
      }
    });
  }
  window.pauseAllMedia = pauseAllMedia;

  // Initialize Storage & Security Engine
  await initAdminStorage();

  // Initialize Subsystems
  initRouter();
  initDrawer();
  initSearch();
  initAdminUI();
  initBreakingNewsTicker();
  initVideoCinemaModal();
  initShareDrawerModal();
  initMobileBottomNav();

  function initShareDrawerModal() {
    const globalShareOverlay = document.getElementById('reelShareOverlay');
    const globalBtnCloseShare = document.getElementById('btnCloseShare');
    const globalBtnCopyLink = document.getElementById('btnCopyReelLink');

    document.addEventListener('click', (e) => {
      const shareBtn = e.target.closest('.btn-share-icon, .btn-trigger-share');
      if (shareBtn) {
        e.preventDefault();
        e.stopPropagation();
        const overlay = document.getElementById('reelShareOverlay');
        if (overlay) {
          const isReelShare = shareBtn.classList.contains('btn-trigger-share') || shareBtn.closest('.reel-right-actions, .mobile-reels-track, #videoReelsView');
          if (isReelShare) {
            overlay.classList.remove('pop-left-bottom');
            overlay.classList.add('pop-right-bottom');
          } else {
            overlay.classList.remove('pop-right-bottom');
            overlay.classList.add('pop-left-bottom');
          }
          overlay.style.display = 'flex';
        }
      }
    });

    if (globalBtnCloseShare) {
      globalBtnCloseShare.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const overlay = document.getElementById('reelShareOverlay');
        if (overlay) overlay.style.display = 'none';
      });
    }

    if (globalShareOverlay) {
      globalShareOverlay.addEventListener('click', (e) => {
        if (e.target === globalShareOverlay) {
          globalShareOverlay.style.display = 'none';
        }
      });

      const waItem = globalShareOverlay.querySelector('.share-wa');
      if (waItem) {
        waItem.onclick = (e) => {
          e.stopPropagation();
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`, '_blank');
        };
      }
      const liItem = globalShareOverlay.querySelector('.share-li');
      if (liItem) {
        liItem.onclick = (e) => {
          e.stopPropagation();
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
        };
      }
      const xItem = globalShareOverlay.querySelector('.share-x');
      if (xItem) {
        xItem.onclick = (e) => {
          e.stopPropagation();
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank');
        };
      }
      const fbItem = globalShareOverlay.querySelector('.share-fb');
      if (fbItem) {
        fbItem.onclick = (e) => {
          e.stopPropagation();
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
        };
      }
    }

    if (globalBtnCopyLink) {
      globalBtnCopyLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(window.location.href);
        const textSpan = globalBtnCopyLink.querySelector('span');
        if (textSpan) {
          const orig = textSpan.textContent;
          textSpan.textContent = 'Copied!';
          setTimeout(() => textSpan.textContent = orig, 1800);
        }
      });
    }
  }

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
   * Strictly filters articles based on active court tab ('supreme-court' | 'high-court' | 'sessions-court').
   * @param {string} courtFilter - 'supreme-court' | 'high-court' | 'sessions-court'
   */
  function renderLatestNewsSection(courtFilter = 'supreme-court') {
    if (!latestNewsGrid) return;
    activeLatestNewsCourtFilter = courtFilter;

    const isMatchingCourt = (itemCourt, filter) => {
      const c = (itemCourt || '').toUpperCase().trim();
      if (filter === 'high-court') {
        return c.includes('HIGH');
      }
      if (filter === 'sessions-court') {
        return c.includes('SESSIONS');
      }
      return c.includes('SUPREME') || (!c.includes('HIGH') && !c.includes('SESSIONS'));
    };

    const allArticles = getCollection('articles') || [];
    const publishedArticles = allArticles.filter(a => (a.status || 'published') === 'published');

    // Filter dynamic articles strictly by active court tab
    const dynamicFiltered = publishedArticles.filter(a => isMatchingCourt(a.court, courtFilter));

    // Filter default news items strictly by active court tab
    const defaultFiltered = defaultLatestNews.filter(d => isMatchingCourt(d.court, courtFilter));

    // Combine dynamic published items with default items, avoiding duplicates
    const dynamicIds = new Set(dynamicFiltered.map(a => String(a.id)));
    const combinedList = [
      ...dynamicFiltered,
      ...defaultFiltered.filter(d => !dynamicIds.has(String(d.id)))
    ];

    // Final strict filter verification
    const finalFiltered = combinedList.filter(a => isMatchingCourt(a.court, courtFilter));

    // Homepage layout: 9 cards (3 columns x 3 rows)
    const homepageDynamic = finalFiltered.slice(0, 9);

    if (homepageDynamic.length === 0) {
      latestNewsGrid.innerHTML = `
        <div class="no-articles-placeholder text-center" style="padding: 40px 20px; color: #666;">
          <p>No published news items available for this court category.</p>
        </div>
      `;
      return;
    }

    const col0 = homepageDynamic.filter((_, i) => i % 3 === 0);
    const col1 = homepageDynamic.filter((_, i) => i % 3 === 1);
    const col2 = homepageDynamic.filter((_, i) => i % 3 === 2);

    const finalColumns = [col0, col1, col2];

    latestNewsGrid.innerHTML = `
      <div class="news-masonry-grid">
        ${finalColumns.map((colItems, colIndex) => `
          <div class="news-masonry-col">
            ${colItems.map((item, itemIdx) => createNewsCardHTML(item, colIndex, itemIdx)).join('')}
          </div>
        `).join('')}
      </div>

      <div class="latest-news-view-more-wrap text-center">
        <button class="btn-secondary" id="viewMoreBtn">View More Updates</button>
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

  let activeArticleId = null;

  // Hero Navigation Arrow Controls (Previous / Next Article switcher)
  if (prevArticleBtn) {
    prevArticleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const allArticles = getCollection('articles') || [];
      if (!allArticles.length) return;
      const curIdx = allArticles.findIndex(a => String(a.id) === String(activeArticleId));
      const prevIdx = (curIdx > 0) ? curIdx - 1 : allArticles.length - 1;
      renderArticleDetail(allArticles[prevIdx].id);
      showView('article', true);
    });
  }

  if (nextArticleBtn) {
    nextArticleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const allArticles = getCollection('articles') || [];
      if (!allArticles.length) return;
      const curIdx = allArticles.findIndex(a => String(a.id) === String(activeArticleId));
      const nextIdx = (curIdx !== -1 && curIdx < allArticles.length - 1) ? curIdx + 1 : 0;
      renderArticleDetail(allArticles[nextIdx].id);
      showView('article', true);
    });
  }

  // Newsletter Form Submissions
  newsletterForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        const email = input.value.trim();
        const source = form.closest('.drawer-newsletter-card') ? 'Drawer Widget' 
                     : form.closest('.sidebar-newsletter-box') ? 'Article Sidebar'
                     : form.closest('.category-newsletter') ? 'Category Page'
                     : 'Homepage Form';

        const res = await addSubscriber(email, source);
        if (res && res.isExisting) {
          showToast(`You are already subscribed to Lokal Adalat with ${email}!`, 'info', 4000);
        } else {
          showToast(`🎉 Thank you for subscribing! Daily legal briefings will be sent to ${email}.`, 'success', 4000);
        }
        input.value = '';
      }
    });
  });

  /**
   * Dynamic renderer for the Articles to Read section on the Home page.
   */
  function renderArticlesToReadSection() {
    const sectionElem = document.getElementById('articles-to-read-sec');
    if (!sectionElem) return;

    const container = sectionElem.querySelector('.articles-grid');
    if (!container) return;

    const allArticles = getCollection('articles');
    let publishedArticles = (allArticles || []).filter(a => 
      a.status === 'published' && (!a.targetSection || a.targetSection === 'articles-to-read-sec')
    );

    if (!publishedArticles || publishedArticles.length === 0) {
      publishedArticles = defaultArticlesToRead;
    }

    // Limit to EXACTLY 3 cards on the Home page as requested
    const homepageArticles = publishedArticles.slice(0, 3);

    container.innerHTML = homepageArticles.map(item => `
      <article class="article-card blog-click" data-id="${item.id}">
        <div class="article-thumb">
          <img src="${formatMediaUrl(item.image || item.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80')}" alt="${item.title}" loading="lazy">
        </div>
        <div class="article-body">
          <h3 class="article-title"><a href="#" class="blog-click" data-id="${item.id}">${item.title}</a></h3>
          <p class="article-excerpt">${item.excerpt || ''}</p>
          <div class="article-meta">
            <span class="article-author">${item.author || 'Editorial Desk'}</span>
            <div class="article-meta-right">
              <span class="article-readtime">${item.readTime || '12 min read'}</span>
              <span class="article-read-more blog-click" data-id="${item.id}">Read More <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></span>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    // Wire View More Articles button listener
    const viewMoreArticlesBtn = document.getElementById('viewMoreArticlesBtn');
    if (viewMoreArticlesBtn) {
      viewMoreArticlesBtn.onclick = (e) => {
        e.preventDefault();
        openCategoryView('Articles to Read', 'Expert analysis beyond the headlines.');
      };
    }
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
    let topStoriesArticles = (allArticles || []).filter(a => 
      a.status === 'published' && a.targetSection === 'top-stories-sec'
    );

    if (!topStoriesArticles || topStoriesArticles.length === 0) {
      topStoriesArticles = defaultTopStories;
    } else if (topStoriesArticles.length < 5) {
      const currentIds = new Set(topStoriesArticles.map(a => a.id));
      topStoriesArticles = [
        ...topStoriesArticles,
        ...defaultTopStories.filter(d => !currentIds.has(d.id))
      ];
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

    if (leftItems.length === 0 && rightItems.length === 0) {
      gridContainer.style.display = 'flex';
      gridContainer.style.justifyContent = 'center';
      gridContainer.innerHTML = `
        <div class="grid-col middle-col" style="width: 100%; max-width: 680px; margin: 0 auto;">
          <article class="news-card card-hero blog-click" data-id="${heroItem.id}" style="min-height: 340px; max-height: 400px;">
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
      `;
      return;
    }

    gridContainer.style.display = 'grid';
    gridContainer.style.justifyContent = '';
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

    let cards = Array.from(sliderTrack.querySelectorAll('.mobile-slider-card'));
    if (!cards.length) return;

    let currentIndex = 0;
    const totalCards = cards.length;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let isAnimating = false;

    // Helper to position cards in stack (Tinder / Bumble style)
    function layoutStack() {
      cards = Array.from(sliderTrack.querySelectorAll('.mobile-slider-card'));
      cards.forEach((card, idx) => {
        let offset = (idx - currentIndex + totalCards) % totalCards;

        card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.35s ease';
        card.style.pointerEvents = offset === 0 ? 'auto' : 'none';

        if (offset === 0) {
          // Top active card
          card.style.zIndex = '10';
          card.style.opacity = '1';
          card.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
        } else if (offset === 1) {
          // Second card in stack
          card.style.zIndex = '9';
          card.style.opacity = '0.92';
          card.style.transform = 'translate3d(0, 14px, 0) scale(0.95) rotate(0deg)';
        } else if (offset === 2) {
          // Third card in stack
          card.style.zIndex = '8';
          card.style.opacity = '0.75';
          card.style.transform = 'translate3d(0, 26px, 0) scale(0.90) rotate(0deg)';
        } else {
          // Deeper hidden cards
          card.style.zIndex = '5';
          card.style.opacity = '0';
          card.style.transform = 'translate3d(0, 36px, 0) scale(0.85) rotate(0deg)';
        }
      });

      updateDots();
    }

    function updateDots() {
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    // Touch & Mouse Drag Handlers for Top Card
    function handleStart(clientX, clientY) {
      if (isAnimating) return;
      startX = clientX;
      startY = clientY;
      currentX = clientX;
      currentY = clientY;
      isDragging = true;

      const topCard = cards[currentIndex];
      if (topCard) {
        topCard.style.transition = 'none';
      }
    }

    function handleMove(clientX, clientY) {
      if (!isDragging || isAnimating) return;
      currentX = clientX;
      currentY = clientY;

      const diffX = currentX - startX;
      const diffY = currentY - startY;
      const rotate = diffX * 0.08; // Tinder-style tilt rotation

      const topCard = cards[currentIndex];
      if (topCard) {
        topCard.style.transform = `translate3d(${diffX}px, ${diffY}px, 0) rotate(${rotate}deg)`;
      }

      // Lift the next card in stack as top card is pulled
      const nextIndex = (currentIndex + 1) % totalCards;
      const nextCard = cards[nextIndex];
      if (nextCard) {
        const dragProgress = Math.min(Math.abs(diffX) / 180, 1);
        const nextScale = 0.95 + (0.05 * dragProgress);
        const nextY = 14 - (14 * dragProgress);
        nextCard.style.transition = 'none';
        nextCard.style.transform = `translate3d(0, ${nextY}px, 0) scale(${nextScale}) rotate(0deg)`;
        nextCard.style.opacity = `${0.92 + (0.08 * dragProgress)}`;
      }
    }

    function handleEnd() {
      if (!isDragging || isAnimating) return;
      isDragging = false;

      const diffX = currentX - startX;
      const diffY = currentY - startY;
      const threshold = 70;

      const topCard = cards[currentIndex];

      if (Math.abs(diffX) > threshold) {
        // Tinder / Bumble Swipe Out
        isAnimating = true;
        const flyX = diffX > 0 ? window.innerWidth * 1.3 : -window.innerWidth * 1.3;
        const flyRotate = diffX > 0 ? 32 : -32;

        topCard.style.transition = 'transform 0.38s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease';
        topCard.style.transform = `translate3d(${flyX}px, ${diffY * 1.4}px, 0) rotate(${flyRotate}deg)`;
        topCard.style.opacity = '0';

        setTimeout(() => {
          currentIndex = (currentIndex + 1) % totalCards;
          layoutStack();
          isAnimating = false;
        }, 320);
      } else {
        // Snap Back
        layoutStack();
      }
    }

    // Touch events
    sliderTrack.addEventListener('touchstart', (e) => {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    sliderTrack.addEventListener('touchmove', (e) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    sliderTrack.addEventListener('touchend', () => {
      handleEnd();
    });

    // Mouse events for desktop/preview testing on mobile screen width
    sliderTrack.addEventListener('mousedown', (e) => {
      handleStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        handleEnd();
      }
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        if (isAnimating) return;
        currentIndex = idx;
        layoutStack();
      });
    });

    // Initial Stack Setup
    layoutStack();
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
    let currentFeedArticles = [];
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let dragAxis = null;
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
      currentFeedArticles = getFilteredArticles(currentCourtFilter);
      const articles = currentFeedArticles;

      // Render cards + Footer slide as last item
      const cardsHTML = articles.map((item, idx) => {
        const courtTag = item.court || 'SUPREME COURT';
        const tagClass = courtTag.toUpperCase().includes('HIGH') 
          ? 'tag-high-court' 
          : courtTag.toUpperCase().includes('SESSIONS') 
            ? 'tag-sessions-court' 
            : 'tag-supreme-court';

        return `
          <div class="mobile-feed-slide ${idx === 0 ? 'active-slide' : ''}" data-index="${idx}" data-id="${item.id || ''}">
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

    // -------------------------------------------------------------
    // Option A Onboarding & 4-Day Interval Manager
    // -------------------------------------------------------------
    const onboardingOverlay = document.getElementById('courtsOnboardingOverlay');
    const floatingHintBar = document.getElementById('courtsFloatingHintBar');
    const btnGotIt = document.getElementById('btnCourtsOnboardingGotIt');

    function checkAndShowOnboarding() {
      const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
      const lastTimestamp = localStorage.getItem('courts_onboarding_last_timestamp');
      const hasSeenFirst = localStorage.getItem('courts_onboarding_has_seen_first');
      const now = Date.now();

      if (!hasSeenFirst) {
        // First Visit (Day 1) -> Full screen onboarding overlay
        if (onboardingOverlay) onboardingOverlay.classList.add('active');
      } else if (lastTimestamp && (now - Number(lastTimestamp)) >= FOUR_DAYS_MS) {
        // Interval Visit (Day 4+) -> Subtle bottom floating hint bar
        if (floatingHintBar) {
          floatingHintBar.classList.add('active');
          setTimeout(() => {
            floatingHintBar.classList.remove('active');
          }, 4500);
        }
      }
    }

    function dismissOnboarding() {
      if (onboardingOverlay) onboardingOverlay.classList.remove('active');
      if (floatingHintBar) floatingHintBar.classList.remove('active');
      localStorage.setItem('courts_onboarding_last_timestamp', Date.now().toString());
      localStorage.setItem('courts_onboarding_has_seen_first', 'true');
    }

    if (btnGotIt) {
      btnGotIt.addEventListener('click', dismissOnboarding);
    }
    if (onboardingOverlay) {
      onboardingOverlay.addEventListener('click', (e) => {
        if (e.target === onboardingOverlay) dismissOnboarding();
      });
    }

    // -------------------------------------------------------------
    // Horizontal & Vertical Touch/Mouse Drag Listeners
    // -------------------------------------------------------------
    function handleFeedStart(clientX, clientY) {
      startX = clientX;
      startY = clientY;
      endX = clientX;
      endY = clientY;
      isDragging = true;
      dragAxis = null;
      feedTrack.style.transition = 'none';
    }

    function handleFeedMove(clientX, clientY) {
      if (!isDragging) return;
      endX = clientX;
      endY = clientY;
      const diffX = clientX - startX;
      const diffY = clientY - startY;

      // Lock axis after initial movement (> 6px)
      if (!dragAxis) {
        const totalDist = Math.hypot(diffX, diffY);
        if (totalDist > 6) {
          if (Math.abs(diffX) >= Math.abs(diffY)) {
            dragAxis = 'horizontal';
          } else {
            dragAxis = 'vertical';
          }
        } else {
          return;
        }
      }

      if (dragAxis === 'horizontal') {
        const slides = feedTrack.querySelectorAll('.mobile-feed-slide');
        const activeSlide = slides[currentSlideIndex];
        if (activeSlide) {
          activeSlide.style.transition = 'none';
          activeSlide.style.transform = `translateX(${diffX}px)`;
        }
      } else if (dragAxis === 'vertical') {
        // Vertical dragging
        currentTranslateY = prevTranslateY + diffY;
        feedTrack.style.transform = `translateY(${currentTranslateY}px)`;
      }
    }

    function handleFeedEnd() {
      if (!isDragging) return;
      isDragging = false;

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const slides = feedTrack.querySelectorAll('.mobile-feed-slide');
      const activeSlide = slides[currentSlideIndex];
      const currentAxis = dragAxis;
      dragAxis = null;

      // Swipe Left or Right Trigger with Slide-Out Animation
      if (currentAxis === 'horizontal' || Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > 25) {
          dismissOnboarding();

          if (activeSlide) {
            const targetTranslateX = deltaX < 0 ? '-100%' : '100%';
            // Smooth horizontal slide-out animation (Slower & Cinematic)
            activeSlide.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)';
            activeSlide.style.transform = `translateX(${targetTranslateX})`;

            setTimeout(() => {
              // Reset slide transform for next return
              activeSlide.style.transition = 'none';
              activeSlide.style.transform = 'translateX(0)';
              goToFeedSlide(currentSlideIndex, false);

              const readFullBtn = activeSlide.querySelector('.btn-read-full, .blog-click');
              if (readFullBtn) {
                readFullBtn.click();
              } else {
                let articleId = activeSlide.dataset.id || activeSlide.querySelector('[data-id]')?.dataset?.id;
                if (!articleId && currentFeedArticles && currentFeedArticles[currentSlideIndex]) {
                  articleId = currentFeedArticles[currentSlideIndex].id;
                }
                if (articleId) {
                  if (typeof window.renderArticleDetail === 'function') window.renderArticleDetail(articleId);
                  showView('article', true);
                }
              }
            }, 360);
          }
          return;
        } else if (activeSlide) {
          // Snap back active slide horizontally if swipe wasn't completed
          activeSlide.style.transition = 'transform 0.2s ease-out';
          activeSlide.style.transform = 'translateX(0)';
        }
      }

      // Vertical swipe navigation
      const movedBy = currentTranslateY - prevTranslateY;
      if (movedBy < -50 && currentSlideIndex < slides.length - 1) {
        currentSlideIndex += 1;
        dismissOnboarding();
      } else if (movedBy > 50 && currentSlideIndex > 0) {
        currentSlideIndex -= 1;
        dismissOnboarding();
      }
      goToFeedSlide(currentSlideIndex, true);
    }

    const mobileCategoryWrapper = document.getElementById('mobileCategoryWrapper');
    const swipeTargetContainer = mobileCategoryWrapper || verticalFeedContainer;

    swipeTargetContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('.mobile-cat-filter-bar')) return;
      handleFeedStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    swipeTargetContainer.addEventListener('touchmove', (e) => {
      if (isDragging) {
        if (e.cancelable) e.preventDefault();
        handleFeedMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    swipeTargetContainer.addEventListener('touchend', () => {
      handleFeedEnd();
    });

    swipeTargetContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('.mobile-cat-filter-bar')) return;
      // Support both Left Click (0) and Right Click (2) for dragging/swiping from anywhere
      if (e.button === 0 || e.button === 2) {
        handleFeedStart(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        handleFeedMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isDragging) handleFeedEnd();
    });

    // Suppress right-click context menu so user can freely right-click drag swipe up/left anywhere
    swipeTargetContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
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
      checkAndShowOnboarding();
    };

    // Initial render
    renderFeedSlides('Supreme Court');
    checkAndShowOnboarding();
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

    function updateAudioUI(mutedState) {
      isMuted = mutedState;
      reelsTrack.querySelectorAll('.reel-video').forEach(vid => vid.muted = isMuted);
      reelsTrack.querySelectorAll('.reel-audio-btn').forEach(b => {
        const iconUnmuted = b.querySelector('.icon-unmuted');
        const iconMuted = b.querySelector('.icon-muted');
        if (iconUnmuted) iconUnmuted.style.display = isMuted ? 'none' : 'block';
        if (iconMuted) iconMuted.style.display = isMuted ? 'block' : 'none';
      });
    }

    function tryPlayWithAudio() {
      const activeSlide = reelsTrack.querySelectorAll('.reel-slide')[currentReelIndex];
      if (!activeSlide) return;
      const video = activeSlide.querySelector('.reel-video');
      const playBtn = activeSlide.querySelector('.reel-center-play-btn');
      const posterImg = activeSlide.querySelector('.reel-poster');
      if (video) {
        if (video.tagName.toLowerCase() === 'iframe') {
          const ytSrc = video.dataset.ytSrc;
          if (ytSrc) {
            video.src = ytSrc + (ytSrc.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1&rel=0';
          }
          if (playBtn) playBtn.style.opacity = '0';
          if (posterImg) posterImg.style.display = 'none';
        } else {
          updateAudioUI(false);
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              if (playBtn) playBtn.style.opacity = '0';
              if (posterImg) posterImg.style.display = 'none';
            }).catch(() => {});
          }
        }
      }
    }

    function renderReels() {
      const videoList = getCollection('videos');
      if (!videoList || !videoList.length) return;

      reelsTrack.innerHTML = videoList.map((item, idx) => {
        const rawUrl = item.videoUrl || item.video_url || item.url || '';
        const formattedSrc = formatMediaUrl(rawUrl);
        const ytEmbed = parseYouTubeEmbedUrl(formattedSrc);
        const posterUrl = formatMediaUrl(item.posterImage || item.image || item.thumbnail || '/images/supreme-court.jpg');

        let mediaMarkup = '';
        if (ytEmbed) {
          mediaMarkup = `
            <img src="${posterUrl}" alt="${item.title}" class="reel-poster" loading="lazy">
            <iframe class="reel-video reel-yt-iframe" data-yt-src="${ytEmbed}" src="about:blank" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; z-index: 0;"></iframe>
          `;
        } else {
          mediaMarkup = `
            <img src="${posterUrl}" alt="${item.title}" class="reel-poster" loading="lazy">
            <video class="reel-video" loop playsinline muted preload="auto" poster="${posterUrl}" src="${formattedSrc}"></video>
          `;
        }

        return `
        <div class="reel-slide ${idx === 0 ? 'active-reel' : ''}" data-index="${idx}">
          <div class="reel-card">
            <div class="reel-media-wrap">
              ${mediaMarkup}
              <div class="reel-overlay"></div>
            </div>

            <!-- Top Accent Progress Bar -->
            <div class="reel-top-progress-bar">
              <div class="reel-progress-fill"></div>
            </div>

            <!-- Header Overlay -->
            <div class="reel-header-overlay">
              <div class="reel-logo">
                <img src="/images/reels.png" alt="Lokal Adalat Reels" class="reel-logo-img">
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

            <!-- Bottom Information Overlay -->
            <div class="reel-bottom-content">
              <h3 class="reel-title">${item.title}</h3>
              <p class="reel-excerpt collapsed">${item.excerpt || ''}</p>
              <button class="reel-toggle-more">View More ˅</button>
            </div>

            ${idx === 0 ? `
            <div class="reel-swipe-hint">
              Swipe up for next briefing ˅
            </div>` : ''}

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
      `;
      }).join('');

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

      // Stop ALL other media before playing the active reel
      pauseAllMedia();
      slides.forEach((slide, idx) => {
        const isActive = (idx === currentReelIndex);
        slide.classList.toggle('active-reel', isActive);
        const video = slide.querySelector('.reel-video');
        const playBtn = slide.querySelector('.reel-center-play-btn');
        const posterImg = slide.querySelector('.reel-poster');

        if (video) {
          if (video.tagName.toLowerCase() === 'iframe') {
            if (isActive) {
              const ytSrc = video.dataset.ytSrc;
              if (ytSrc) {
                const targetUrl = ytSrc + (ytSrc.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1&rel=0';
                if (video.src !== targetUrl) {
                  video.src = targetUrl;
                }
              }
              if (playBtn) playBtn.style.opacity = '0';
              if (posterImg) posterImg.style.display = 'none';
            } else {
              video.src = 'about:blank';
              if (playBtn) playBtn.style.opacity = '1';
              if (posterImg) posterImg.style.display = 'block';
            }
          } else {
            if (isActive) {
              video.currentTime = 0;
              video.muted = isMuted;
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  if (playBtn) playBtn.style.opacity = '0';
                  if (posterImg) posterImg.style.display = 'none';
                }).catch(() => {
                  video.muted = true;
                  video.play().then(() => {
                    if (playBtn) playBtn.style.opacity = '0';
                    if (posterImg) posterImg.style.display = 'none';
                  }).catch(() => {});
                });
              }
            } else {
              video.pause();
              video.muted = true;
              if (playBtn) playBtn.style.opacity = '1';
              if (posterImg) posterImg.style.display = 'block';
            }
          }
        }
      });
    }

    function attachReelCardEvents() {
      // Toggle Audio Button
      reelsTrack.querySelectorAll('.reel-audio-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          updateAudioUI(!isMuted);
          tryPlayWithAudio();
        });
      });

      // Toggle Play Button
      reelsTrack.querySelectorAll('.reel-center-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const activeSlide = reelsTrack.querySelectorAll('.reel-slide')[currentReelIndex];
          if (!activeSlide) return;
          const video = activeSlide.querySelector('.reel-video');
          const posterImg = activeSlide.querySelector('.reel-poster');
          if (video) {
            if (video.tagName.toLowerCase() === 'iframe') {
              const ytSrc = video.dataset.ytSrc;
              if (ytSrc) {
                video.src = ytSrc + (ytSrc.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1&rel=0';
              }
              btn.style.opacity = '0';
              if (posterImg) posterImg.style.display = 'none';
            } else {
              if (video.paused) {
                video.play();
                btn.style.opacity = '0';
                if (posterImg) posterImg.style.display = 'none';
              } else {
                video.pause();
                btn.style.opacity = '1';
              }
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
  }



    // Touch & Mouse Drag events for vertical reel swipe
    function handleReelStart(clientY) {
      startY = clientY;
      isDragging = true;
      reelsTrack.style.transition = 'none';
    }

    function handleReelMove(clientY) {
      if (!isDragging) return;
      const diffY = clientY - startY;
      currentTranslateY = prevTranslateY + diffY;
      reelsTrack.style.transform = `translateY(${currentTranslateY}px)`;
    }

    function handleReelEnd() {
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
    }

    reelsContainer.addEventListener('touchstart', (e) => {
      handleReelStart(e.touches[0].clientY);
    }, { passive: true });

    reelsContainer.addEventListener('touchmove', (e) => {
      if (isDragging) {
        if (e.cancelable) e.preventDefault();
        handleReelMove(e.touches[0].clientY);
      }
    }, { passive: false });

    reelsContainer.addEventListener('touchend', () => {
      handleReelEnd();
    });

    reelsContainer.addEventListener('mousedown', (e) => {
      // Support both Left Click (0) and Right Click (2) for dragging/swiping
      if (e.button === 0 || e.button === 2) {
        handleReelStart(e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        handleReelMove(e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) handleReelEnd();
    });

    // Suppress right-click context menu so user can freely right-click drag swipe up/down
    reelsContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
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

    reelsContainer.addEventListener('click', () => {
      tryPlayWithAudio();
    });
    reelsContainer.addEventListener('touchstart', () => {
      tryPlayWithAudio();
    }, { passive: true });

    // Expose global render method
    window.renderMobileVideoReels = (index = 0) => {
      renderReels();
      requestAnimationFrame(() => {
        goToReelSlide(index, false);
        tryPlayWithAudio();
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
              <div class="mobile-article-footer-right">
                <span class="mobile-article-readtime">${item.readTime || '8 min read'}</span>
                <button class="mobile-article-read-btn blog-click" data-id="${item.id}">
                  Read More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
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

    if (closeBtn) {
      closeBtn.style.display = 'none';
    }

    let isUserPaused = false;

    // Toggle Play / Pause
    function togglePlay(forcePlay) {
      const ytEmbed = featuredCard.dataset.ytEmbed;
      let iframe = featuredCard.querySelector('.yt-iframe-player');
      const isPlaying = featuredCard.classList.contains('is-playing');
      const shouldPlay = typeof forcePlay === 'boolean' ? forcePlay : !isPlaying;

      if (ytEmbed) {
        if (!shouldPlay) {
          if (iframe) {
            try {
              iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch(e) {}
            iframe.src = 'about:blank';
            iframe.style.display = 'none';
          }
          updatePlayBtnIcon(false);
        } else {
          pauseAllMedia();
          if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'yt-iframe-player';
            iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 16px; position: absolute; inset: 0; z-index: 5;';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            featuredCard.appendChild(iframe);
          }
          const embedWithAutoplay = ytEmbed + (ytEmbed.includes('?') ? '&' : '?') + 'autoplay=1&mute=1&enablejsapi=1';
          iframe.src = embedWithAutoplay;
          iframe.style.display = 'block';
          updatePlayBtnIcon(true);
        }
        return;
      }

      // Native HTML5 Video
      if (shouldPlay) {
        pauseAllMedia(videoElem);
        const playPromise = videoElem.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            updatePlayBtnIcon(true);
          }).catch(err => {
            // Autoplay policy fallback: mute and play
            videoElem.muted = true;
            videoElem.play().then(() => {
              updatePlayBtnIcon(true);
            }).catch(e => console.log('Autoplay blocked by browser policy:', e));
          });
        }
      } else {
        videoElem.pause();
        updatePlayBtnIcon(false);
      }
    }

    function updatePlayBtnIcon(isPlaying) {
      const posterLayer = featuredCard.querySelector('.video-poster-layer');
      const featuredOverlay = document.getElementById('featuredVideoOverlay');
      if (isPlaying) {
        featuredCard.classList.add('is-playing');
        featuredCard.classList.remove('is-paused');
        if (playBtn) {
          playBtn.style.opacity = '0';
          playBtn.style.pointerEvents = 'none';
          playBtn.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }
        if (posterLayer) posterLayer.style.opacity = '0';
        if (featuredOverlay) featuredOverlay.style.opacity = '0';
      } else {
        featuredCard.classList.remove('is-playing');
        featuredCard.classList.add('is-paused');
        if (playBtn) {
          playBtn.style.opacity = '1';
          playBtn.style.pointerEvents = 'auto';
          playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
        }
        if (playIcon) playIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
        if (posterLayer) posterLayer.style.opacity = '1';
        if (featuredOverlay) featuredOverlay.style.opacity = '0.35';
      }
    }

    videoElem.addEventListener('play', () => updatePlayBtnIcon(true));
    videoElem.addEventListener('pause', () => updatePlayBtnIcon(false));
    videoElem.addEventListener('ended', () => updatePlayBtnIcon(false));

    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (featuredCard.classList.contains('is-playing')) {
          isUserPaused = true;
          togglePlay(false);
        } else {
          isUserPaused = false;
          togglePlay(true);
        }
      });
    }

    if (featuredCard) {
      featuredCard.addEventListener('click', () => {
        if (featuredCard.classList.contains('is-playing')) {
          isUserPaused = true;
          togglePlay(false);
        } else {
          isUserPaused = false;
          togglePlay(true);
        }
      });
    }

    // Viewport IntersectionObserver to trigger Autoplay when video section enters view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (videoSection.offsetParent === null) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          const isPlaying = featuredCard.classList.contains('is-playing') || (!videoElem.paused && videoElem.currentTime > 0);
          if (!isPlaying && !isUserPaused) {
            videoElem.muted = true;
            togglePlay(true);
          }
        }
      });
    }, {
      threshold: [0.1, 0.35, 0.6]
    });

    observer.observe(videoSection);
  }

  // ==========================================================================
  // CINEMATIC VIDEO PLAYBACK MODAL POPUP
  // ==========================================================================
  function initVideoCinemaModal() {
    const modal = document.getElementById('videoCinemaModal');
    const backdrop = document.getElementById('videoCinemaBackdrop');
    const closeBtn = document.getElementById('videoCinemaCloseBtn');

    function closeModal() {
      if (!modal) return;
      const mediaContainer = document.getElementById('videoCinemaMediaContainer');
      if (mediaContainer) {
        mediaContainer.querySelectorAll('video').forEach(v => {
          try {
            v.pause();
            v.muted = true;
            v.src = '';
            v.load();
          } catch(e) {}
        });
        mediaContainer.querySelectorAll('iframe').forEach(f => {
          try {
            f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            f.src = 'about:blank';
          } catch(e) {}
        });
        mediaContainer.innerHTML = '';
      }
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
      }
    });

    window.closeVideoCinemaModal = closeModal;
  }

  function playSelectedVideo(videoData, fallbackTitle = '') {
    const modal = document.getElementById('videoCinemaModal');
    const mediaContainer = document.getElementById('videoCinemaMediaContainer');
    const courtBadge = document.getElementById('videoCinemaCourtBadge');
    const dateTag = document.getElementById('videoCinemaDate');
    const titleTag = document.getElementById('videoCinemaTitle');

    if (!modal || !mediaContainer) return;

    // CRITICAL: Stop ALL currently playing media before opening cinema modal
    pauseAllMedia();
    // Also clear any previous cinema modal content to prevent stale audio
    mediaContainer.querySelectorAll('video').forEach(v => {
      try { v.pause(); v.muted = true; v.src = ''; v.load(); } catch(e) {}
    });
    mediaContainer.querySelectorAll('iframe').forEach(f => {
      try { f.src = 'about:blank'; } catch(e) {}
    });
    mediaContainer.innerHTML = '';

    const url = typeof videoData === 'string' ? videoData : (videoData.url || videoData.videoUrl || videoData.video_url || '');
    const title = typeof videoData === 'object' ? (videoData.title || fallbackTitle) : (fallbackTitle || '');
    const court = typeof videoData === 'object' ? (videoData.court || 'SUPREME COURT') : 'SUPREME COURT';
    const date = typeof videoData === 'object' ? (videoData.date || '17 July 2025') : '17 July 2025';
    const duration = typeof videoData === 'object' ? (videoData.duration || '5m 28sec') : '5m 28sec';
    const poster = typeof videoData === 'object' ? (videoData.poster || '') : '';

    if (courtBadge) courtBadge.textContent = court;
    if (dateTag) dateTag.textContent = `${date} · ${duration}`;
    if (titleTag) titleTag.textContent = title || 'Delhi HC Directs Government to File Response on Electoral Bonds Case';

    const formattedSrc = formatMediaUrl(url);
    const ytEmbed = parseYouTubeEmbedUrl(formattedSrc);

    if (ytEmbed) {
      mediaContainer.innerHTML = `
        <iframe src="${ytEmbed}&autoplay=1" 
                class="video-cinema-iframe" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
      `;
    } else if (formattedSrc && (formattedSrc.endsWith('.mp4') || formattedSrc.endsWith('.webm') || formattedSrc.includes('/uploads/'))) {
      mediaContainer.innerHTML = `
        <video src="${formattedSrc}" 
               controls 
               autoplay 
               poster="${formatMediaUrl(poster)}"
               class="video-cinema-native-player">
        </video>
      `;
    } else {
      mediaContainer.innerHTML = `
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&autoplay=1" 
                class="video-cinema-iframe" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
      `;
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  window.playSelectedVideo = playSelectedVideo;

  // ==========================================================================
  // DYNAMIC VIDEO CORNER RENDERER (CMS Connected)
  // ==========================================================================
  function parseYouTubeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (match && match[2] && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?enablejsapi=1&rel=0`;
    }
    return null;
  }

  function renderVideoCornerSection() {
    const videoElem = document.getElementById('mainVideoPlayer');
    const featuredCard = document.getElementById('featuredVideoCard');
    const playBtn = document.getElementById('mainVideoPlayBtn');
    const featuredOverlay = document.getElementById('featuredVideoOverlay');
    const desktopTitle = document.getElementById('mainVideoDesktopTitle');
    const mobileTitle = document.getElementById('mainVideoMobileTitle');
    const durationTag = document.getElementById('mainVideoDurationTag');
    const dateTag = document.getElementById('mainVideoDateTag');
    const courtTag = document.getElementById('mainVideoCourtTag');
    const playlistContainer = document.getElementById('mobileVideoPlaylist');

    let videoList = getCollection('videos');
    if (!videoList || !videoList.length) {
      videoList = defaultVideos;
    }

    const featuredVideo = videoList[0];

    if (featuredCard && featuredVideo) {
      const formattedPoster = formatMediaUrl(featuredVideo.posterImage || featuredVideo.image || featuredVideo.thumbnail);
      const formattedSrc = formatMediaUrl(featuredVideo.videoUrl || featuredVideo.video_url);
      const ytEmbed = parseYouTubeEmbedUrl(formattedSrc);

      // Ensure dedicated poster layer element exists inside featuredCard
      let posterLayer = featuredCard.querySelector('.video-poster-layer');
      if (!posterLayer) {
        posterLayer = document.createElement('div');
        posterLayer.className = 'video-poster-layer';
        posterLayer.style.cssText = 'position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 2; transition: opacity 0.35s ease; pointer-events: none;';
        featuredCard.insertBefore(posterLayer, featuredCard.firstChild);
      }

      if (formattedPoster) {
        posterLayer.style.backgroundImage = `url("${formattedPoster}")`;
        posterLayer.style.opacity = '1';
      }

      featuredCard.dataset.ytEmbed = ytEmbed || '';

      let iframe = featuredCard.querySelector('.yt-iframe-player');
      if (iframe) {
        iframe.src = 'about:blank';
        iframe.style.display = 'none';
      }

      if (ytEmbed) {
        if (videoElem) videoElem.style.display = 'none';
        if (posterLayer) posterLayer.style.display = 'block';
        if (featuredOverlay) featuredOverlay.style.display = 'block';
        if (playBtn) playBtn.style.display = 'flex';
      } else {
        if (posterLayer) posterLayer.style.display = 'block';
        if (videoElem) {
          videoElem.style.display = 'block';
          if (formattedPoster) videoElem.poster = formattedPoster;
          if (formattedSrc && videoElem.src !== formattedSrc) {
            videoElem.src = formattedSrc;
            videoElem.load();
          }
        }
        if (featuredOverlay) featuredOverlay.style.display = 'block';
        if (playBtn) playBtn.style.display = 'flex';
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
            <img src="${formatMediaUrl(item.posterImage || item.image || item.thumbnail || '/images/courtroom.jpg')}" alt="${item.title}">
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
          if (selected) {
            const selPoster = formatMediaUrl(selected.posterImage || selected.image || selected.thumbnail);
            const selSrc = formatMediaUrl(selected.videoUrl || selected.video_url);
            const selYt = parseYouTubeEmbedUrl(selSrc);

            let posterLayer = featuredCard.querySelector('.video-poster-layer');
            if (posterLayer && selPoster) posterLayer.style.backgroundImage = `url("${selPoster}")`;

            featuredCard.dataset.ytEmbed = selYt || '';

            if (selYt) {
              if (videoElem) {
                videoElem.pause();
                videoElem.style.display = 'none';
              }
            } else if (videoElem) {
              videoElem.style.display = 'block';
              if (selPoster) videoElem.poster = selPoster;
              if (selSrc) {
                videoElem.src = selSrc;
                videoElem.load();
              }
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
    activeArticleId = article.id;

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

    // Update Adjacent Prev / Next Article Titles for Arrow Hover Preview
    const allArticles = getCollection('articles') || [];
    const curIdx = allArticles.findIndex(a => String(a.id) === String(article.id));
    const prevIdx = (curIdx > 0) ? curIdx - 1 : allArticles.length - 1;
    const nextIdx = (curIdx !== -1 && curIdx < allArticles.length - 1) ? curIdx + 1 : 0;

    const prevTitleElem = document.getElementById('prevArticleTitle');
    const nextTitleElem = document.getElementById('nextArticleTitle');

    if (prevTitleElem && allArticles[prevIdx]) {
      prevTitleElem.textContent = allArticles[prevIdx].title || 'Previous Article';
    }
    if (nextTitleElem && allArticles[nextIdx]) {
      nextTitleElem.textContent = allArticles[nextIdx].title || 'Next Article';
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

    // Render Main Article Body (Heading -> Description -> Section Image)
    const bodyContentElem = articleView.querySelector('.article-content-main');
    if (bodyContentElem) {
      bodyContentElem.innerHTML = normalizedSections.map((sec, idx) => {
        const titleText = sec.title || `Section ${idx + 1}`;
        const match = titleText.match(/^(\d{2}|\d+)\s*(.*)/);
        const headingText = match ? match[2] : titleText;
        const sectionId = `sec-art-${idx + 1}`;
        const pText = sec.content || '';
        const imgUrl = sec.image || sec.imageUrl || sec.featured_image || (idx === 1 ? 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1000&q=80' : '');
        const captionText = sec.caption || sec.imageCaption || (idx === 1 ? 'The Constitution Bench during hearings on the Digital Privacy Framework case. Photo: Supreme Court of India / PTI' : '');

        return `
          <section id="${sectionId}" class="article-section" style="margin-bottom: 32px;">
            ${idx === 0 ? `
              <p class="lead-paragraph">${pText}</p>
            ` : `
              <h2 class="article-heading">${headingText}</h2>
              <p>${pText}</p>
            `}
            ${imgUrl ? `
              <figure class="article-body-figure" style="margin-top: 20px; margin-bottom: 24px;">
                <img src="${imgUrl}" alt="${headingText || 'Section image'}" class="article-body-img" style="width: 100%; border-radius: 14px; object-fit: cover; max-height: 480px; display: block; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                ${captionText ? `
                  <figcaption class="figure-caption" style="font-size: 12.5px; color: #64748B; margin-top: 10px; line-height: 1.5;">
                    ${captionText}
                  </figcaption>
                ` : ''}
              </figure>
            ` : ''}
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

  // ==========================================================================
  // BREAKING NEWS TICKER ROTATOR ENGINE (5-Second Loop)
  // ==========================================================================
  function initBreakingNewsTicker() {
    const tickerTextElem = document.getElementById('tickerText');
    if (!tickerTextElem) return;

    let tickerIndex = 0;
    let tickerTimer = null;

    function getTickerHeadlines() {
      const headlines = [];
      
      // 1. Add admin-added custom breaking news titles
      const newsItems = getCollection('news') || [];
      newsItems.forEach(n => {
        if (n && n.title && n.title.trim()) {
          headlines.push({ title: n.title.trim(), articleId: null });
        }
      });

      // 2. Add published article titles strictly belonging to the Top Stories section
      const articles = getCollection('articles') || [];
      articles.forEach(a => {
        if (a && a.title && a.title.trim()) {
          const isTopStory = a.targetSection === 'top-stories-sec';
          const isPublished = a.status === 'published' || !a.status;
          if (isTopStory && isPublished) {
            headlines.push({ title: a.title.trim(), articleId: a.id });
          }
        }
      });

      // Fallback: If no top story articles are flagged yet, include default top story headlines
      if (!headlines.length) {
        headlines.push(
          { title: "Sessions Court Delivers Landmark Verdict in Corporate Fraud Matter", articleId: null },
          { title: "Supreme Court Agrees to Hear Plea on Digital Data Protection Rules", articleId: null },
          { title: "High Court Issues Mandatory Guidelines for Environmental Impact Assessment", articleId: null }
        );
      }

      return headlines;
    }

    function updateTickerDisplay() {
      const headlines = getTickerHeadlines();
      if (!headlines.length) return;

      if (tickerIndex >= headlines.length) {
        tickerIndex = 0;
      }

      const current = headlines[tickerIndex];

      // Smooth Fade-out & Fade-in Transition
      tickerTextElem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      tickerTextElem.style.opacity = '0';
      tickerTextElem.style.transform = 'translateY(-6px)';

      setTimeout(() => {
        tickerTextElem.textContent = current.title;
        tickerTextElem.style.transform = 'translateY(6px)';
        if (current.articleId) {
          tickerTextElem.dataset.id = current.articleId;
          tickerTextElem.style.cursor = 'pointer';
        } else {
          delete tickerTextElem.dataset.id;
          tickerTextElem.style.cursor = 'default';
        }

        requestAnimationFrame(() => {
          tickerTextElem.style.opacity = '1';
          tickerTextElem.style.transform = 'translateY(0)';
        });
      }, 300);
    }

    // Article click on ticker
    tickerTextElem.addEventListener('click', () => {
      const id = tickerTextElem.dataset.id;
      if (id && typeof openArticleView === 'function') {
        openArticleView(id);
      }
    });

    // Start 5-second interval loop
    clearInterval(tickerTimer);
    updateTickerDisplay();
    tickerTimer = setInterval(() => {
      tickerIndex++;
      updateTickerDisplay();
    }, 5000);

    // Subscribe to data updates so news or article additions instantly refresh ticker
    subscribeDataChange(() => {
      updateTickerDisplay();
    });
  }

  // ==========================================================================
  // DESKTOP AUTO-SCROLL READING PROGRESS LOADER (Exact Brand Yellow #C98806)
  // ==========================================================================
  const scrollProgressBar = document.getElementById('articleScrollProgressBar');
  function updateReadingProgress() {
    const articleView = document.getElementById('articleView');
    if (!articleView || articleView.style.display === 'none' || !scrollProgressBar) {
      if (scrollProgressBar) scrollProgressBar.style.width = '0%';
      return;
    }

    const totalHeight = articleView.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) {
      scrollProgressBar.style.width = '100%';
      return;
    }

    const currentProgress = (window.scrollY / totalHeight) * 100;
    const clampedProgress = Math.min(Math.max(currentProgress, 0), 100);
    scrollProgressBar.style.width = `${clampedProgress}%`;
  }

  // -------------------------------------------------------------
  // Mobile Article Detail View Swipe-Right to Go Back Gesture
  // -------------------------------------------------------------
  const articleViewElem = document.getElementById('articleView');
  if (articleViewElem) {
    let artStartX = 0;
    let artStartY = 0;
    let artEndX = 0;
    let artEndY = 0;
    let artIsDragging = false;

    articleViewElem.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 768) return;
      artStartX = e.touches[0].clientX;
      artStartY = e.touches[0].clientY;
      artEndX = artStartX;
      artEndY = artStartY;
      artIsDragging = true;
    }, { passive: true });

    articleViewElem.addEventListener('touchmove', (e) => {
      if (!artIsDragging || window.innerWidth > 768) return;
      artEndX = e.touches[0].clientX;
      artEndY = e.touches[0].clientY;
      const diffX = artEndX - artStartX;
      const diffY = artEndY - artStartY;

      // Track rightward swipe drag
      if (diffX > 0 && Math.abs(diffX) > Math.abs(diffY)) {
        articleViewElem.style.transition = 'none';
        articleViewElem.style.transform = `translateX(${diffX}px)`;
      }
    }, { passive: true });

    articleViewElem.addEventListener('touchend', () => {
      if (!artIsDragging || window.innerWidth > 768) return;
      artIsDragging = false;
      const deltaX = artEndX - artStartX;
      const deltaY = artEndY - artStartY;

      if (deltaX > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Smooth slide-out animation to the right (Identical to Courts page swipe)
        articleViewElem.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)';
        articleViewElem.style.transform = 'translateX(100%)';

        setTimeout(() => {
          articleViewElem.style.transition = 'none';
          articleViewElem.style.transform = 'translateX(0)';
          if (typeof showView === 'function') {
            showView('category', true);
          } else {
            const backBtn = document.getElementById('backToHomeBtn');
            if (backBtn) backBtn.click();
          }
        }, 320);
      } else {
        // Snap back cleanly if threshold was not reached
        articleViewElem.style.transition = 'transform 0.2s ease-out';
        articleViewElem.style.transform = 'translateX(0)';
      }
    });
  }

  window.renderArticleDetail = renderArticleDetail;
  window.openVideoListingView = openVideoListingView;

  // Mobile Smart Header: Reveal sticky header when scrolling UP, hide when scrolling DOWN
  function initMobileSmartHeaderScroll() {
    let lastScrollTop = 0;
    const stickyContainer = document.getElementById('stickyTopContainer');
    if (!stickyContainer) return;

    window.addEventListener('scroll', () => {
      if (window.innerWidth > 768) return;
      const isHeaderPage = document.body.classList.contains('view-home-active') || 
                           document.body.classList.contains('view-article-active') || 
                           document.body.classList.contains('view-mobile-articles-active') || 
                           document.body.classList.contains('view-category-active');
      if (!isHeaderPage) return;

      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScrollTop <= 60) {
        stickyContainer.classList.remove('header-sticky-up', 'header-scroll-down-hide');
      } else if (currentScrollTop > lastScrollTop + 6) {
        // Scrolling DOWN: hide header
        stickyContainer.classList.remove('header-sticky-up');
        stickyContainer.classList.add('header-scroll-down-hide');
      } else if (currentScrollTop < lastScrollTop - 6) {
        // Scrolling UP: reveal sticky header at top!
        stickyContainer.classList.remove('header-scroll-down-hide');
        stickyContainer.classList.add('header-sticky-up');
      }

      lastScrollTop = Math.max(0, currentScrollTop);
    }, { passive: true });
  }

  initMobileSmartHeaderScroll();
});
