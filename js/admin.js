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
  // SLIDES MANAGER (Images & Videos with Custom Duration & Looping)
  // ================================================================
  function renderSlideList() {
    const slides = getData('slides');
    const container = document.getElementById('slides-list');
    if (!container) return;

    if (slides.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <span class="material-symbols-outlined">perm_media</span>
          <p>No slides added yet. Add an image or video URL above.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = slides.map((slide, idx) => {
      const type = slide.type || detectMediaType(slide.url);
      const isVideo = type === 'video';
      const duration = slide.duration ? `${slide.duration}s` : 'Global (10s)';
      const loopLabel = isVideo ? (slide.loop !== false ? ' · Loop: On' : ' · Loop: Off') : '';

      return `
        <div class="admin-list-item anim-fade-in" style="animation-delay: ${idx * 0.05}s">
          <div class="admin-list-item-content">
            ${isVideo ? `
              <div class="admin-list-item-thumb" style="display:flex;align-items:center;justify-content:center;background:rgba(239,71,111,0.15);color:var(--accent-red);border-radius:6px;">
                <span class="material-symbols-outlined" style="font-size:24px;">videocam</span>
              </div>
            ` : `
              <img class="admin-list-item-thumb" src="${escapeHtml(slide.url)}" alt="Slide thumbnail" 
                   onerror="this.style.background='var(--accent-red-container)'; this.alt='Failed to load';" />
            `}
            <div class="admin-list-item-text">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="admin-list-item-title">Slide ${idx + 1}${slide.caption ? ' — ' + escapeHtml(slide.caption) : ''}</span>
                <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(255,255,255,0.08);color:var(--accent-gold);font-weight:700;text-transform:uppercase;">${type}</span>
                <span style="font-size:11px;color:var(--text-muted);">Duration: ${duration}${loopLabel}</span>
              </div>
              <span class="admin-list-item-subtitle truncate" style="max-width:460px">${escapeHtml(slide.url)}</span>
            </div>
          </div>
          <div class="admin-list-item-actions">
            <button class="btn-icon" onclick="window._editSlide('${slide.id}')" title="Edit Slide">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn-icon" onclick="window._removeSlide('${slide.id}')" title="Remove Slide">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function saveOrAddSlide() {
    const editIdEl = document.getElementById('slide-edit-id');
    const typeEl = document.getElementById('slide-type-select');
    const urlInput = document.getElementById('slide-url-input');
    const captionInput = document.getElementById('slide-caption-input');
    const posSelect = document.getElementById('slide-pos-select');
    const durationInput = document.getElementById('slide-duration-input');
    const loopInput = document.getElementById('slide-loop-input');

    if (!urlInput) return;

    const url = urlInput.value.trim();
    if (!url) {
      urlInput.focus();
      urlInput.style.borderColor = 'var(--accent-red)';
      setTimeout(() => urlInput.style.borderColor = '', 1500);
      return;
    }

    const type = typeEl ? typeEl.value : detectMediaType(url);
    const position = posSelect ? posSelect.value : 'center';
    const duration = durationInput && durationInput.value ? parseInt(durationInput.value) : 10;
    const loop = loopInput ? loopInput.checked : true;
    const caption = captionInput ? captionInput.value.trim() : '';

    let slides = getData('slides');
    const editId = editIdEl ? editIdEl.value : '';

    if (editId) {
      // Update existing slide
      slides = slides.map(s => {
        if (s.id === editId) {
          return { ...s, type, url, caption, position, duration, loop };
        }
        return s;
      });
      showSaveToast('Slide updated successfully!');
    } else {
      // Add new slide
      slides.push({
        id: generateId(),
        type,
        url,
        caption,
        position,
        duration,
        loop
      });
      showSaveToast('Slide added successfully!');
    }

    setData('slides', slides);
    resetSlideForm();
    renderSlideList();
  }

  function editSlide(id) {
    const slides = getData('slides');
    const slide = slides.find(s => s.id === id);
    if (!slide) return;

    const editIdEl = document.getElementById('slide-edit-id');
    const typeEl = document.getElementById('slide-type-select');
    const urlInput = document.getElementById('slide-url-input');
    const captionInput = document.getElementById('slide-caption-input');
    const posSelect = document.getElementById('slide-pos-select');
    const durationInput = document.getElementById('slide-duration-input');
    const loopInput = document.getElementById('slide-loop-input');
    const addBtnText = document.getElementById('add-slide-text');
    const addBtnIcon = document.getElementById('add-slide-icon');
    const cancelBtn = document.getElementById('cancel-slide-btn');

    if (editIdEl) editIdEl.value = slide.id;
    if (typeEl) typeEl.value = slide.type || detectMediaType(slide.url);
    if (urlInput) urlInput.value = slide.url || '';
    if (captionInput) captionInput.value = slide.caption || '';
    if (posSelect) posSelect.value = slide.position || 'center';
    if (durationInput) durationInput.value = slide.duration || 10;
    if (loopInput) loopInput.checked = slide.loop !== false;

    if (addBtnText) addBtnText.textContent = 'Update Slide';
    if (addBtnIcon) addBtnIcon.textContent = 'check';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    urlInput.focus();
  }

  function resetSlideForm() {
    const editIdEl = document.getElementById('slide-edit-id');
    const urlInput = document.getElementById('slide-url-input');
    const captionInput = document.getElementById('slide-caption-input');
    const posSelect = document.getElementById('slide-pos-select');
    const durationInput = document.getElementById('slide-duration-input');
    const loopInput = document.getElementById('slide-loop-input');
    const addBtnText = document.getElementById('add-slide-text');
    const addBtnIcon = document.getElementById('add-slide-icon');
    const cancelBtn = document.getElementById('cancel-slide-btn');

    if (editIdEl) editIdEl.value = '';
    if (urlInput) urlInput.value = '';
    if (captionInput) captionInput.value = '';
    if (posSelect) posSelect.value = 'center';
    if (durationInput) durationInput.value = '';
    if (loopInput) loopInput.checked = true;

    if (addBtnText) addBtnText.textContent = 'Add Slide';
    if (addBtnIcon) addBtnIcon.textContent = 'add';
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  function removeSlide(id) {
    let slides = getData('slides');
    slides = slides.filter(s => s.id !== id);
    setData('slides', slides);
    resetSlideForm();
    renderSlideList();
    showSaveToast('Slide removed');
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
    showSaveToast('Office hours updated and saved!');
  }

  // ================================================================
  // ROOM SCHEDULE EDITOR (Add & Edit Support)
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
          <span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:32px;border-radius:4px;background:rgba(91,141,239,0.15);color:var(--accent-blue);font-family:var(--font-display);font-weight:700;font-size:13px;flex-shrink:0">${escapeHtml(room.room)}</span>
          <div class="admin-list-item-text">
            <span class="admin-list-item-title">${escapeHtml(room.event)}</span>
            <span class="admin-list-item-subtitle">${escapeHtml(room.instructor)} · ${escapeHtml(room.time)}</span>
          </div>
        </div>
        <div class="admin-list-item-actions">
          <button class="btn-icon" onclick="window._editRoom('${room.id}')" title="Edit Schedule">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="btn-icon" onclick="window._removeRoom('${room.id}')" title="Remove Room">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function saveOrAddRoom() {
    const editIdEl = document.getElementById('room-edit-id');
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

    let rooms = getData('roomSchedule');
    const editId = editIdEl ? editIdEl.value : '';

    if (editId) {
      rooms = rooms.map(r => {
        if (r.id === editId) {
          return {
            ...r,
            room: roomNum,
            event: event,
            instructor: instructorEl ? instructorEl.value.trim() : '',
            time: timeEl ? timeEl.value.trim() : ''
          };
        }
        return r;
      });
      showSaveToast('Room schedule updated!');
    } else {
      rooms.push({
        id: generateId(),
        room: roomNum,
        event: event,
        instructor: instructorEl ? instructorEl.value.trim() : '',
        time: timeEl ? timeEl.value.trim() : ''
      });
      showSaveToast('Room schedule added!');
    }

    setData('roomSchedule', rooms);
    resetRoomForm();
    renderRoomList();
  }

  function editRoom(id) {
    const rooms = getData('roomSchedule');
    const room = rooms.find(r => r.id === id);
    if (!room) return;

    const editIdEl = document.getElementById('room-edit-id');
    const roomEl = document.getElementById('room-number-input');
    const eventEl = document.getElementById('room-event-input');
    const instructorEl = document.getElementById('room-instructor-input');
    const timeEl = document.getElementById('room-time-input');
    const addBtnText = document.getElementById('add-room-text');
    const addBtnIcon = document.getElementById('add-room-icon');
    const cancelBtn = document.getElementById('cancel-room-btn');

    if (editIdEl) editIdEl.value = room.id;
    if (roomEl) roomEl.value = room.room || '';
    if (eventEl) eventEl.value = room.event || '';
    if (instructorEl) instructorEl.value = room.instructor || '';
    if (timeEl) timeEl.value = room.time || '';

    if (addBtnText) addBtnText.textContent = 'Update';
    if (addBtnIcon) addBtnIcon.textContent = 'check';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    roomEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    roomEl.focus();
  }

  function resetRoomForm() {
    const editIdEl = document.getElementById('room-edit-id');
    const roomEl = document.getElementById('room-number-input');
    const eventEl = document.getElementById('room-event-input');
    const instructorEl = document.getElementById('room-instructor-input');
    const timeEl = document.getElementById('room-time-input');
    const addBtnText = document.getElementById('add-room-text');
    const addBtnIcon = document.getElementById('add-room-icon');
    const cancelBtn = document.getElementById('cancel-room-btn');

    if (editIdEl) editIdEl.value = '';
    if (roomEl) roomEl.value = '';
    if (eventEl) eventEl.value = '';
    if (instructorEl) instructorEl.value = '';
    if (timeEl) timeEl.value = '';

    if (addBtnText) addBtnText.textContent = 'Add';
    if (addBtnIcon) addBtnIcon.textContent = 'add';
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  function removeRoom(id) {
    let rooms = getData('roomSchedule');
    rooms = rooms.filter(r => r.id !== id);
    setData('roomSchedule', rooms);
    resetRoomForm();
    renderRoomList();
    showSaveToast('Room schedule removed');
  }

  // ================================================================
  // ANNOUNCEMENTS & ADVISORIES EDITOR (Typography & Live Preview)
  // ================================================================
  const ACCENT_COLORS = {
    alert: '#ff5757',
    warm: '#fca311',
    available: '#31d29c',
    info: '#5ea8ff'
  };

  const ACCENT_ICONS = {
    alert: 'priority_high',
    warm: 'warning',
    available: 'check_circle',
    info: 'info'
  };

  function updateAnnouncementLivePreview() {
    const textEl = document.getElementById('announcement-text-input');
    const familyEl = document.getElementById('announcement-family-select');
    const sizeEl = document.getElementById('announcement-size-select');
    const styleEl = document.getElementById('announcement-style-select');
    const accentEl = document.getElementById('announcement-accent-select');

    const previewItem = document.getElementById('announcement-preview-item');
    const previewText = document.getElementById('announcement-preview-text');
    const previewIcon = document.getElementById('announcement-preview-icon');

    if (!previewItem || !previewText || !previewIcon) return;

    const rawText = textEl ? textEl.value.trim() : '';
    const family = familyEl ? familyEl.value : "'Inter', sans-serif";
    const size = sizeEl ? sizeEl.value : 'auto';
    const styleVal = styleEl ? styleEl.value : 'normal-600';
    const accentVal = accentEl ? accentEl.value : 'alert';

    const [fontStyle, fontWeight] = styleVal.split('-');
    const colorHex = ACCENT_COLORS[accentVal] || ACCENT_COLORS.alert;
    const iconName = ACCENT_ICONS[accentVal] || 'priority_high';

    previewText.textContent = rawText || 'Type an announcement above to see the live preview...';
    previewText.style.fontFamily = family;
    previewText.style.fontSize = size === 'auto' ? '14.5px' : size;
    previewText.style.fontStyle = fontStyle || 'normal';
    previewText.style.fontWeight = fontWeight || '600';

    previewItem.style.borderLeftColor = colorHex;
    previewIcon.style.color = colorHex;
    previewIcon.textContent = iconName;
  }

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

    container.innerHTML = items.map((item, idx) => {
      const accent = item.accent || item.priority || 'alert';
      const colorHex = ACCENT_COLORS[accent] || ACCENT_COLORS.alert;
      const iconName = ACCENT_ICONS[accent] || 'priority_high';
      const fontDisplay = item.fontFamily ? item.fontFamily.split(',')[0].replace(/['"]/g, '') : 'Default';
      const sizeDisplay = item.fontSize && item.fontSize !== 'auto' ? item.fontSize : 'Auto';

      return `
        <div class="admin-list-item anim-fade-in" style="animation-delay: ${idx * 0.05}s">
          <div class="admin-list-item-content">
            <span class="material-symbols-outlined" style="color:${colorHex};font-size:22px;flex-shrink:0">${iconName}</span>
            <div class="admin-list-item-text">
              <span class="admin-list-item-title" style="font-family:${item.fontFamily || 'inherit'};font-size:14px;font-style:${item.fontStyle || 'normal'};font-weight:${item.fontWeight || '600'};">${escapeHtml(item.text)}</span>
              <span class="admin-list-item-subtitle" style="display:flex;gap:12px;margin-top:2px;font-size:11px;">
                <span>Family: <strong>${fontDisplay}</strong></span>
                <span>Size: <strong>${sizeDisplay}</strong></span>
                <span>Accent: <strong style="color:${colorHex};text-transform:capitalize;">${accent}</strong></span>
              </span>
            </div>
          </div>
          <div class="admin-list-item-actions">
            <button class="btn-icon" onclick="window._editAnnouncement('${item.id}')" title="Edit Announcement" style="color:var(--accent-warm);">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn-icon" onclick="window._removeAnnouncement('${item.id}')" title="Remove Announcement">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function addAnnouncement() {
    const editIdEl = document.getElementById('announcement-edit-id');
    const textEl = document.getElementById('announcement-text-input');
    const familyEl = document.getElementById('announcement-family-select');
    const sizeEl = document.getElementById('announcement-size-select');
    const styleEl = document.getElementById('announcement-style-select');
    const accentEl = document.getElementById('announcement-accent-select');

    if (!textEl) return;
    const text = textEl.value.trim();
    if (!text) {
      textEl.focus();
      textEl.style.borderColor = 'var(--accent-red)';
      setTimeout(() => textEl.style.borderColor = '', 1500);
      return;
    }

    const editId = editIdEl ? editIdEl.value : '';
    const family = familyEl ? familyEl.value : "'Inter', sans-serif";
    const size = sizeEl ? sizeEl.value : 'auto';
    const styleVal = styleEl ? styleEl.value : 'normal-600';
    const [fontStyle, fontWeight] = styleVal.split('-');
    const accent = accentEl ? accentEl.value : 'alert';

    let items = getData('announcements');

    if (editId) {
      items = items.map(item => {
        if (item.id === editId) {
          return {
            ...item,
            text,
            fontFamily: family,
            fontSize: size,
            fontStyle: fontStyle || 'normal',
            fontWeight: fontWeight || '600',
            accent: accent
          };
        }
        return item;
      });
      showSaveToast('Notice updated!');
    } else {
      items.push({
        id: generateId(),
        text,
        fontFamily: family,
        fontSize: size,
        fontStyle: fontStyle || 'normal',
        fontWeight: fontWeight || '600',
        accent: accent
      });
      showSaveToast('Notice added!');
    }

    setData('announcements', items);
    resetAnnouncementForm();
    renderAnnouncementList();
  }

  function editAnnouncement(id) {
    const items = getData('announcements');
    const item = items.find(a => a.id === id);
    if (!item) return;

    const editIdEl = document.getElementById('announcement-edit-id');
    const textEl = document.getElementById('announcement-text-input');
    const familyEl = document.getElementById('announcement-family-select');
    const sizeEl = document.getElementById('announcement-size-select');
    const styleEl = document.getElementById('announcement-style-select');
    const accentEl = document.getElementById('announcement-accent-select');
    const addBtnText = document.getElementById('add-announcement-text');
    const addBtnIcon = document.getElementById('add-announcement-icon');
    const cancelBtn = document.getElementById('cancel-announcement-btn');

    if (editIdEl) editIdEl.value = item.id;
    if (textEl) textEl.value = item.text || '';
    if (familyEl) familyEl.value = item.fontFamily || "'Inter', sans-serif";
    if (sizeEl) sizeEl.value = item.fontSize || 'auto';
    if (styleEl) styleEl.value = `${item.fontStyle || 'normal'}-${item.fontWeight || '600'}`;
    if (accentEl) accentEl.value = item.accent || item.priority || 'alert';

    if (addBtnText) addBtnText.textContent = 'Update Notice';
    if (addBtnIcon) addBtnIcon.textContent = 'save';
    if (cancelBtn) cancelBtn.style.display = '';

    updateAnnouncementLivePreview();
    textEl.focus();
  }

  function resetAnnouncementForm() {
    const editIdEl = document.getElementById('announcement-edit-id');
    const textEl = document.getElementById('announcement-text-input');
    const familyEl = document.getElementById('announcement-family-select');
    const sizeEl = document.getElementById('announcement-size-select');
    const styleEl = document.getElementById('announcement-style-select');
    const accentEl = document.getElementById('announcement-accent-select');
    const addBtnText = document.getElementById('add-announcement-text');
    const addBtnIcon = document.getElementById('add-announcement-icon');
    const cancelBtn = document.getElementById('cancel-announcement-btn');

    if (editIdEl) editIdEl.value = '';
    if (textEl) textEl.value = '';
    if (familyEl) familyEl.value = "'Inter', sans-serif";
    if (sizeEl) sizeEl.value = 'auto';
    if (styleEl) styleEl.value = 'normal-600';
    if (accentEl) accentEl.value = 'alert';

    if (addBtnText) addBtnText.textContent = 'Add Notice';
    if (addBtnIcon) addBtnIcon.textContent = 'add';
    if (cancelBtn) cancelBtn.style.display = 'none';

    updateAnnouncementLivePreview();
  }

  function removeAnnouncement(id) {
    let items = getData('announcements');
    items = items.filter(a => a.id !== id);
    setData('announcements', items);
    resetAnnouncementForm();
    renderAnnouncementList();
    showSaveToast('Notice removed');
  }

  window._editAnnouncement = editAnnouncement;
  window._cancelAnnouncementEdit = resetAnnouncementForm;

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
    // Slide add / save
    const addSlideBtn = document.getElementById('add-slide-btn');
    if (addSlideBtn) addSlideBtn.addEventListener('click', saveOrAddSlide);

    // Cancel slide edit
    const cancelSlideBtn = document.getElementById('cancel-slide-btn');
    if (cancelSlideBtn) cancelSlideBtn.addEventListener('click', resetSlideForm);

    // Slide URL — Enter key
    const slideUrlInput = document.getElementById('slide-url-input');
    if (slideUrlInput) slideUrlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveOrAddSlide();
    });

    // Auto switch media type on URL change if video detected
    if (slideUrlInput) {
      slideUrlInput.addEventListener('input', () => {
        const detected = detectMediaType(slideUrlInput.value);
        const typeSelect = document.getElementById('slide-type-select');
        if (typeSelect && detected === 'video') {
          typeSelect.value = 'video';
        }
      });
    }

    // Office hours save
    const saveOfficeBtn = document.getElementById('save-office-btn');
    if (saveOfficeBtn) saveOfficeBtn.addEventListener('click', saveOfficeHours);

    // Schedules of the Month add / save
    const addRoomBtn = document.getElementById('save-room-btn') || document.getElementById('add-room-btn');
    if (addRoomBtn) addRoomBtn.addEventListener('click', saveOrAddRoom);

    // Cancel schedule edit
    const cancelRoomBtn = document.getElementById('cancel-room-btn');
    if (cancelRoomBtn) cancelRoomBtn.addEventListener('click', resetRoomForm);

    // Announcement add / save
    const addAnnouncementBtn = document.getElementById('add-announcement-btn');
    if (addAnnouncementBtn) addAnnouncementBtn.addEventListener('click', addAnnouncement);

    // Announcement inputs — live preview updates
    const announcementInput = document.getElementById('announcement-text-input');
    const announcementFamily = document.getElementById('announcement-family-select');
    const announcementSize = document.getElementById('announcement-size-select');
    const announcementStyle = document.getElementById('announcement-style-select');
    const announcementAccent = document.getElementById('announcement-accent-select');

    if (announcementInput) {
      announcementInput.addEventListener('input', updateAnnouncementLivePreview);
    }
    if (announcementFamily) {
      announcementFamily.addEventListener('change', updateAnnouncementLivePreview);
    }
    if (announcementSize) {
      announcementSize.addEventListener('change', updateAnnouncementLivePreview);
    }
    if (announcementStyle) {
      announcementStyle.addEventListener('change', updateAnnouncementLivePreview);
    }
    if (announcementAccent) {
      announcementAccent.addEventListener('change', updateAnnouncementLivePreview);
    }

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
  window._editSlide = editSlide;
  window._removeRoom = removeRoom;
  window._editRoom = editRoom;
  window._removeAnnouncement = removeAnnouncement;
  window._removeFlash = removeFlash;


  // ---- Boot ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
