/* ================================================================
   ADMIN CMS PAGE LOGIC
   Form handling, localStorage CRUD for all sections
   ================================================================ */

(function () {
  'use strict';

  // ---- Initialize ----
  function init() {
    startClock();
    startWeather();
    loadAllSections();
    bindFormEvents();
  }

  // ---- Load All Sections ----
  function loadAllSections() {
    renderSlideList();
    loadOfficeHoursForm();
    renderRoomList();
    renderAnnouncementList();
    renderFlashList();
    loadCarouselSettingsForm();
  }

  // ================================================================
  // SLIDES MANAGER
  // ================================================================
  function renderSlideList() {
    const slides = getData('slides');
    const container = document.getElementById('slides-list');
    if (!container) return;

    if (slides.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">image</span>
          <p>No slides added yet. Paste an image URL above to add one.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = slides.map((slide, idx) => `
      <div class="admin-list-item anim-fade-in" style="animation-delay: ${idx * 0.05}s">
        <div class="admin-list-item-content">
          <img class="admin-list-item-thumb" src="${escapeHtml(slide.url)}" alt="Slide thumbnail" 
               onerror="this.style.background='var(--accent-red-container)'; this.alt='Failed to load';" />
          <div class="admin-list-item-text">
            <span class="admin-list-item-title">Slide ${idx + 1}${slide.caption ? ' — ' + escapeHtml(slide.caption) : ''}</span>
            <span class="admin-list-item-subtitle truncate" style="max-width:400px">${escapeHtml(slide.url)}</span>
          </div>
        </div>
        <div class="admin-list-item-actions">
          <button class="btn-icon" onclick="window._removeSlide('${slide.id}')" title="Remove Slide">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function addSlide() {
    const urlInput = document.getElementById('slide-url-input');
    const captionInput = document.getElementById('slide-caption-input');
    if (!urlInput) return;

    const url = urlInput.value.trim();
    if (!url) {
      urlInput.focus();
      urlInput.style.borderColor = 'var(--accent-red)';
      setTimeout(() => urlInput.style.borderColor = '', 1500);
      return;
    }

    const slides = getData('slides');
    slides.push({
      id: generateId(),
      url: url,
      caption: captionInput ? captionInput.value.trim() : ''
    });
    setData('slides', slides);

    urlInput.value = '';
    if (captionInput) captionInput.value = '';
    renderSlideList();
  }

  function removeSlide(id) {
    let slides = getData('slides');
    slides = slides.filter(s => s.id !== id);
    setData('slides', slides);
    renderSlideList();
  }

  // ================================================================
  // OFFICE HOURS EDITOR
  // ================================================================
  function loadOfficeHoursForm() {
    const data = getData('officeHours');
    const nameEl = document.getElementById('office-name-input');
    const roomEl = document.getElementById('office-room-input');
    const timeEl = document.getElementById('office-time-input');
    const statusEl = document.getElementById('office-status-select');
    const initialsEl = document.getElementById('office-initials-input');

    if (nameEl) nameEl.value = data.name || '';
    if (roomEl) roomEl.value = data.room || '';
    if (timeEl) timeEl.value = data.time || '';
    if (statusEl) statusEl.value = data.status || 'available';
    if (initialsEl) initialsEl.value = data.initials || '';
  }

  function saveOfficeHours() {
    const data = {
      name: document.getElementById('office-name-input')?.value.trim() || 'Dean\'s Office',
      room: document.getElementById('office-room-input')?.value.trim() || 'IT Building',
      time: document.getElementById('office-time-input')?.value.trim() || '8:00 AM – 5:00 PM',
      status: document.getElementById('office-status-select')?.value || 'available',
      initials: document.getElementById('office-initials-input')?.value.trim() || 'DO'
    };
    setData('officeHours', data);
    showSaveToast('Office hours saved!');
  }

  // ================================================================
  // ROOM SCHEDULE EDITOR
  // ================================================================
  function renderRoomList() {
    const rooms = getData('roomSchedule');
    const container = document.getElementById('rooms-list');
    if (!container) return;

    if (rooms.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">meeting_room</span>
          <p>No room schedules added yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = rooms.map((room, idx) => `
      <div class="admin-list-item anim-fade-in" style="animation-delay: ${idx * 0.05}s">
        <div class="admin-list-item-content">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:32px;border-radius:4px;background:rgba(91,141,239,0.15);color:var(--accent-blue);font-family:var(--font-display);font-weight:700;font-size:13px;flex-shrink:0">${escapeHtml(room.room)}</span>
          <div class="admin-list-item-text">
            <span class="admin-list-item-title">${escapeHtml(room.event)}</span>
            <span class="admin-list-item-subtitle">${escapeHtml(room.instructor)} · ${escapeHtml(room.time)}</span>
          </div>
        </div>
        <div class="admin-list-item-actions">
          <button class="btn-icon" onclick="window._removeRoom('${room.id}')" title="Remove Room">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function addRoom() {
    const roomEl = document.getElementById('room-number-input');
    const eventEl = document.getElementById('room-event-input');
    const instructorEl = document.getElementById('room-instructor-input');
    const timeEl = document.getElementById('room-time-input');

    if (!roomEl || !eventEl) return;
    const roomNum = roomEl.value.trim();
    const event = eventEl.value.trim();

    if (!roomNum || !event) {
      if (!roomNum) { roomEl.focus(); roomEl.style.borderColor = 'var(--accent-red)'; }
      else { eventEl.focus(); eventEl.style.borderColor = 'var(--accent-red)'; }
      setTimeout(() => { roomEl.style.borderColor = ''; eventEl.style.borderColor = ''; }, 1500);
      return;
    }

    const rooms = getData('roomSchedule');
    rooms.push({
      id: generateId(),
      room: roomNum,
      event: event,
      instructor: instructorEl ? instructorEl.value.trim() : '',
      time: timeEl ? timeEl.value.trim() : ''
    });
    setData('roomSchedule', rooms);

    roomEl.value = '';
    eventEl.value = '';
    if (instructorEl) instructorEl.value = '';
    if (timeEl) timeEl.value = '';
    renderRoomList();
  }

  function removeRoom(id) {
    let rooms = getData('roomSchedule');
    rooms = rooms.filter(r => r.id !== id);
    setData('roomSchedule', rooms);
    renderRoomList();
  }

  // ================================================================
  // ANNOUNCEMENTS EDITOR
  // ================================================================
  function renderAnnouncementList() {
    const items = getData('announcements');
    const container = document.getElementById('announcements-list');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">notifications_off</span>
          <p>No announcements added yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((item, idx) => `
      <div class="admin-list-item anim-fade-in" style="animation-delay: ${idx * 0.05}s">
        <div class="admin-list-item-content">
          <span class="material-symbols-outlined" style="color:var(--accent-red);font-size:20px;flex-shrink:0">priority_high</span>
          <div class="admin-list-item-text">
            <span class="admin-list-item-title">${escapeHtml(item.text)}</span>
          </div>
        </div>
        <div class="admin-list-item-actions">
          <button class="btn-icon" onclick="window._removeAnnouncement('${item.id}')" title="Remove">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function addAnnouncement() {
    const textEl = document.getElementById('announcement-text-input');
    if (!textEl) return;
    const text = textEl.value.trim();
    if (!text) {
      textEl.focus();
      textEl.style.borderColor = 'var(--accent-red)';
      setTimeout(() => textEl.style.borderColor = '', 1500);
      return;
    }

    const items = getData('announcements');
    items.push({ id: generateId(), text: text, priority: 'high' });
    setData('announcements', items);
    textEl.value = '';
    renderAnnouncementList();
  }

  function removeAnnouncement(id) {
    let items = getData('announcements');
    items = items.filter(a => a.id !== id);
    setData('announcements', items);
    renderAnnouncementList();
  }

  // ================================================================
  // FLASH ANNOUNCEMENTS EDITOR
  // ================================================================
  function renderFlashList() {
    const items = getData('flashItems');
    const container = document.getElementById('flash-list');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">campaign</span>
          <p>No flash announcements added yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((item, idx) => `
      <div class="admin-list-item anim-fade-in" style="animation-delay: ${idx * 0.05}s">
        <div class="admin-list-item-content">
          <span class="material-symbols-outlined" style="color:var(--accent-gold);font-size:20px;flex-shrink:0">campaign</span>
          <div class="admin-list-item-text">
            <span class="admin-list-item-title">${escapeHtml(item.text)}</span>
          </div>
        </div>
        <div class="admin-list-item-actions">
          <button class="btn-icon" onclick="window._removeFlash('${item.id}')" title="Remove">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function addFlash() {
    const textEl = document.getElementById('flash-text-input');
    if (!textEl) return;
    const text = textEl.value.trim();
    if (!text) {
      textEl.focus();
      textEl.style.borderColor = 'var(--accent-red)';
      setTimeout(() => textEl.style.borderColor = '', 1500);
      return;
    }

    const items = getData('flashItems');
    items.push({ id: generateId(), text: text });
    setData('flashItems', items);
    textEl.value = '';
    renderFlashList();
  }

  function removeFlash(id) {
    let items = getData('flashItems');
    items = items.filter(f => f.id !== id);
    setData('flashItems', items);
    renderFlashList();
  }

  // ================================================================
  // CAROUSEL SETTINGS
  // ================================================================
  function loadCarouselSettingsForm() {
    const settings = getData('carouselSettings');
    const durationEl = document.getElementById('carousel-duration-input');
    const autoEl = document.getElementById('carousel-auto-input');

    if (durationEl) durationEl.value = settings.duration || 10;
    if (autoEl) autoEl.checked = settings.autoRotate !== false;

    // Update range label
    const label = document.getElementById('carousel-duration-label');
    if (label && durationEl) label.textContent = `${durationEl.value}s`;
  }

  function saveCarouselSettings() {
    const durationEl = document.getElementById('carousel-duration-input');
    const autoEl = document.getElementById('carousel-auto-input');

    const settings = {
      duration: durationEl ? parseInt(durationEl.value) || 10 : 10,
      autoRotate: autoEl ? autoEl.checked : true
    };
    setData('carouselSettings', settings);
    showSaveToast('Carousel settings saved!');
  }

  // ================================================================
  // FORM BINDINGS
  // ================================================================
  function bindFormEvents() {
    // Slide add
    const addSlideBtn = document.getElementById('add-slide-btn');
    if (addSlideBtn) addSlideBtn.addEventListener('click', addSlide);

    // Slide URL — Enter key
    const slideUrlInput = document.getElementById('slide-url-input');
    if (slideUrlInput) slideUrlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addSlide();
    });

    // Office hours save
    const saveOfficeBtn = document.getElementById('save-office-btn');
    if (saveOfficeBtn) saveOfficeBtn.addEventListener('click', saveOfficeHours);

    // Room add
    const addRoomBtn = document.getElementById('add-room-btn');
    if (addRoomBtn) addRoomBtn.addEventListener('click', addRoom);

    // Announcement add
    const addAnnouncementBtn = document.getElementById('add-announcement-btn');
    if (addAnnouncementBtn) addAnnouncementBtn.addEventListener('click', addAnnouncement);

    // Announcement text — Enter key
    const announcementInput = document.getElementById('announcement-text-input');
    if (announcementInput) announcementInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addAnnouncement();
    });

    // Flash add
    const addFlashBtn = document.getElementById('add-flash-btn');
    if (addFlashBtn) addFlashBtn.addEventListener('click', addFlash);

    // Flash text — Enter key
    const flashInput = document.getElementById('flash-text-input');
    if (flashInput) flashInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addFlash();
    });

    // Carousel settings save
    const saveCarouselBtn = document.getElementById('save-carousel-btn');
    if (saveCarouselBtn) saveCarouselBtn.addEventListener('click', saveCarouselSettings);

    // Duration slider label update
    const durationInput = document.getElementById('carousel-duration-input');
    const durationLabel = document.getElementById('carousel-duration-label');
    if (durationInput && durationLabel) {
      durationInput.addEventListener('input', () => {
        durationLabel.textContent = `${durationInput.value}s`;
      });
    }
  }

  // ================================================================
  // TOAST NOTIFICATION
  // ================================================================
  function showSaveToast(msg) {
    let toast = document.getElementById('save-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'save-toast';
      toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        padding: 12px 24px; border-radius: 10px;
        background: var(--accent-green-container); color: var(--accent-green);
        font-family: var(--font-display); font-weight: 700; font-size: 14px;
        letter-spacing: 0.04em;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        transform: translateY(20px); opacity: 0;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = '✓ ' + msg;
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
    }, 2500);
  }

  // ---- Helpers ----
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Expose global functions ----
  window._removeSlide = removeSlide;
  window._removeRoom = removeRoom;
  window._removeAnnouncement = removeAnnouncement;
  window._removeFlash = removeFlash;

  // ---- Boot ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
