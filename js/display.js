/* ================================================================
   DISPLAY PAGE LOGIC
   Carousel, Sidebar, Flash Ticker
   ================================================================ */

(function () {
  'use strict';

  let currentSlide = 0;
  let slideCount = 0;
  let slideDuration = 10;
  let remainingTime = 10;
  let isPaused = false;
  let tickTimer = null;

  // ---- Initialize ----
  function init() {
    startClock();
    startWeather();
    loadCarouselSettings();
    renderSlides();
    renderOfficeHours();
    renderRoomSchedule();
    renderAnnouncements();
    renderFlashTicker();
    startAutoRotate();

    // Listen for storage changes from admin page
    window.addEventListener('storage', onStorageChange);
  }

  // ---- Storage Change Listener ----
  function onStorageChange(e) {
    if (!e.key) return;
    const keyMap = Object.entries(DATA_KEYS);
    for (const [name, storageKey] of keyMap) {
      if (e.key === storageKey) {
        switch (name) {
          case 'slides':
            renderSlides();
            break;
          case 'officeHours':
            renderOfficeHours();
            break;
          case 'roomSchedule':
            renderRoomSchedule();
            break;
          case 'announcements':
            renderAnnouncements();
            break;
          case 'flashItems':
            renderFlashTicker();
            break;
          case 'carouselSettings':
            loadCarouselSettings();
            break;
        }
      }
    }
  }

  // ---- Carousel ----
  function loadCarouselSettings() {
    const settings = getData('carouselSettings');
    slideDuration = settings.duration || 10;
    remainingTime = slideDuration;
    isPaused = !settings.autoRotate;
  }

  function getSlideDuration(slide) {
    if (slide && slide.duration && parseInt(slide.duration) > 0) {
      return parseInt(slide.duration);
    }
    return slideDuration || 10;
  }

  function renderSlides() {
    const slides = getData('slides');
    const viewport = document.getElementById('carousel-viewport');
    const dotsContainer = document.getElementById('carousel-dots');
    const countText = document.getElementById('carousel-count');

    if (!viewport) return;

    slideCount = slides.length;

    if (slideCount === 0) {
      viewport.innerHTML = `
        <div class="carousel-empty">
          <span class="material-symbols-outlined">perm_media</span>
          <p>No slides yet</p>
          <small>Open the Admin CMS to add image or video slides</small>
        </div>
      `;
      if (dotsContainer) dotsContainer.innerHTML = '';
      if (countText) countText.textContent = 'No slides';
      return;
    }

    // Clamp current slide
    if (currentSlide >= slideCount) currentSlide = 0;

    // Build slide elements
    viewport.innerHTML = slides.map((slide, idx) => {
      const type = slide.type || detectMediaType(slide.url);
      const isCurrent = idx === currentSlide;
      const isVideo = type === 'video';

      let mediaHtml = '';
      if (isVideo) {
        const u = (slide.url || '').trim();
        const isEmbed = u.includes('youtube.com/') || u.includes('youtu.be/') || u.includes('vimeo.com/');
        if (isEmbed) {
          const embedUrl = parseVideoEmbedUrl(u, isCurrent, slide.loop !== false);
          mediaHtml = `
            <div class="carousel-video-wrap">
              <iframe src="${embedUrl}" 
                      allow="autoplay; encrypted-media; picture-in-picture" 
                      allowfullscreen 
                      class="carousel-video-frame"></iframe>
            </div>
          `;
        } else {
          // Direct video file (mp4, webm, etc.)
          mediaHtml = `
            <video class="carousel-video" 
                   src="${escapeHtml(slide.url)}" 
                   ${isCurrent ? 'autoplay' : ''} 
                   muted 
                   playsinline 
                   ${slide.loop !== false ? 'loop' : ''}
                   onended="window._onVideoEnded(${idx})"
                   onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'carousel-empty\\'><span class=\\'material-symbols-outlined\\'>videocam_off</span><p>Video failed to load</p><small>${escapeHtml(slide.url)}</small></div>';"></video>
          `;
        }
      } else {
        // Image
        mediaHtml = `
          <img src="${escapeHtml(slide.url)}" alt="${escapeHtml(slide.caption || 'Slide ' + (idx + 1))}" 
               onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'carousel-empty\\'><span class=\\'material-symbols-outlined\\'>broken_image</span><p>Image failed to load</p><small>${escapeHtml(slide.url)}</small></div>';" />
        `;
      }

      return `
        <div class="carousel-slide ${isCurrent ? 'active' : ''}" data-idx="${idx}">
          ${mediaHtml}
          ${slide.caption ? `<div class="carousel-slide-caption">${escapeHtml(slide.caption)}</div>` : ''}
        </div>
      `;
    }).join('');

    // Build dots
    if (dotsContainer) {
      dotsContainer.innerHTML = slides.map((_, idx) => `
        <button class="carousel-dot ${idx === currentSlide ? 'active' : ''}" 
                onclick="window._goToSlide(${idx})" 
                aria-label="Go to slide ${idx + 1}"></button>
      `).join('');
    }

    if (countText) {
      countText.textContent = `Slide ${currentSlide + 1} of ${slideCount}`;
    }

    const currSlideData = slides[currentSlide];
    remainingTime = getSlideDuration(currSlideData);
    resetProgressBar();
  }

  function goToSlide(idx) {
    if (slideCount === 0) return;
    currentSlide = idx % slideCount;
    const slides = getData('slides');
    const currSlideData = slides[currentSlide];

    const allSlides = document.querySelectorAll('.carousel-slide');
    const allDots = document.querySelectorAll('.carousel-dot');
    const countText = document.getElementById('carousel-count');

    allSlides.forEach((s, i) => {
      const isActive = i === currentSlide;
      s.classList.toggle('active', isActive);

      // Manage video playback
      const vid = s.querySelector('video');
      if (vid) {
        if (isActive) {
          vid.currentTime = 0;
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      }
      const iframe = s.querySelector('iframe');
      if (iframe) {
        const slideItem = slides[i];
        if (slideItem) {
          iframe.src = parseVideoEmbedUrl(slideItem.url, isActive, slideItem.loop !== false);
        }
      }
    });

    allDots.forEach((d, i) => {
      d.classList.toggle('active', i === currentSlide);
    });

    if (countText) {
      countText.textContent = `Slide ${currentSlide + 1} of ${slideCount}`;
    }

    remainingTime = getSlideDuration(currSlideData);
    resetProgressBar();
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % Math.max(slideCount, 1));
  }

  function prevSlide() {
    goToSlide((currentSlide - 1 + slideCount) % Math.max(slideCount, 1));
  }

  function resetProgressBar() {
    const bar = document.getElementById('carousel-progress');
    if (!bar) return;
    const slides = getData('slides');
    const currSlideData = slides[currentSlide];
    const duration = getSlideDuration(currSlideData);

    bar.style.transition = 'none';
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isPaused) {
          bar.style.transition = `width ${duration}s linear`;
          bar.style.width = '100%';
        }
      });
    });
  }

  function startAutoRotate() {
    clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      if (!isPaused && slideCount > 1) {
        remainingTime -= 1;
        const statusEl = document.getElementById('carousel-timer-status');
        if (statusEl) statusEl.textContent = `Next in ${Math.max(remainingTime, 0)}s`;

        if (remainingTime <= 0) {
          nextSlide();
        }
      }
    }, 1000);
  }

  function onVideoEnded(slideIdx) {
    if (slideIdx === currentSlide) {
      const slides = getData('slides');
      const slide = slides[slideIdx];
      // If loop is not explicitly true or duration has passed, proceed
      if (slide && !slide.loop) {
        nextSlide();
      }
    }
  }

  function togglePause() {
    isPaused = !isPaused;
    const icon = document.getElementById('pause-icon');
    const text = document.getElementById('pause-text');
    const bar = document.getElementById('carousel-progress');

    if (isPaused) {
      if (icon) icon.textContent = 'play_arrow';
      if (text) text.textContent = 'Paused';
      if (bar) {
        const w = bar.getBoundingClientRect().width;
        const parent = bar.parentElement.getBoundingClientRect().width;
        const pct = (w / parent * 100) || 0;
        bar.style.transition = 'none';
        bar.style.width = pct + '%';
      }
      // Pause current slide video if any
      const activeVideo = document.querySelector('.carousel-slide.active video');
      if (activeVideo) activeVideo.pause();
    } else {
      if (icon) icon.textContent = 'pause';
      if (text) text.textContent = 'Auto';
      const activeVideo = document.querySelector('.carousel-slide.active video');
      if (activeVideo) activeVideo.play().catch(() => {});
      resetProgressBar();
    }
  }

  // ---- Sidebar: Office Hours ----
  function renderOfficeHours() {
    const data = getData('officeHours');
    const container = document.getElementById('office-hours-content');
    if (!container) return;

    let statusClass = 'available';
    let statusText = 'Available';
    if (data.status === 'busy') { statusClass = 'busy'; statusText = 'In Meeting'; }
    else if (data.status === 'closed') { statusClass = 'closed'; statusText = 'Closed'; }
    else { statusText = 'Available'; }

    document.getElementById('office-status-pill').className = `status-pill ${statusClass}`;
    document.getElementById('office-status-pill').innerHTML = `
      ${statusClass !== 'closed' ? '<span class="status-dot"></span>' : ''}
      ${statusText.toUpperCase()}
    `;

    container.innerHTML = `
      <div class="office-card">
        <div class="office-avatar">${escapeHtml(data.initials || 'DO')}</div>
        <div class="office-info">
          <span class="office-name">${escapeHtml(data.name)}</span>
          <span class="office-role">${escapeHtml(data.room)}</span>
          <span class="office-time">${escapeHtml(data.time)}</span>
        </div>
      </div>
    `;
  }

  // ---- Sidebar: Room Schedule ----
  function renderRoomSchedule() {
    const data = getData('roomSchedule');
    const container = document.getElementById('room-schedule-content');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">event_busy</span>
          <p>No room schedules set</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(item => `
      <div class="room-item">
        <div class="room-item-left">
          <span class="room-badge">${escapeHtml(item.room)}</span>
          <div class="room-details">
            <span class="room-event truncate">${escapeHtml(item.event)}</span>
            <span class="room-instructor">${escapeHtml(item.instructor)}</span>
          </div>
        </div>
        <span class="room-time">${escapeHtml(item.time)}</span>
      </div>
    `).join('');
  }

  // ---- Sidebar: Announcements ----
  function renderAnnouncements() {
    const data = getData('announcements');
    const container = document.getElementById('announcements-content');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">notifications_off</span>
          <p>No announcements</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(item => `
      <div class="announcement-item">
        <span class="material-symbols-outlined">priority_high</span>
        <div>
          <div class="announcement-text">${escapeHtml(item.text)}</div>
        </div>
      </div>
    `).join('');
  }

  // ---- Footer: Flash Ticker ----
  function renderFlashTicker() {
    const data = getData('flashItems');
    const track = document.getElementById('flash-track');
    if (!track) return;

    if (data.length === 0) {
      track.innerHTML = `
        <span class="flash-ticker-item">
          <span class="flash-ticker-dot"></span>
          No flash announcements set — Open Admin CMS to add items
        </span>
      `;
      return;
    }

    const dotColors = ['', 'alt', 'blue'];
    // Duplicate for seamless loop
    const itemsHtml = data.map((item, idx) => `
      <span class="flash-ticker-item">
        <span class="flash-ticker-dot ${dotColors[idx % dotColors.length]}"></span>
        ${escapeHtml(item.text)}
      </span>
    `).join('');

    track.innerHTML = itemsHtml + itemsHtml;
  }

  // ---- Helpers ----
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Expose global functions ----
  window._goToSlide = goToSlide;
  window._nextSlide = nextSlide;
  window._prevSlide = prevSlide;
  window._togglePause = togglePause;
  window._onVideoEnded = onVideoEnded;


  // ---- Boot ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
