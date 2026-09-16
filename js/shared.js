/* ================================================================
   SHARED UTILITIES
   Weather API, Clock, Data Management (localStorage)
   ================================================================ */

// ---- Data Keys ----
const DATA_KEYS = {
  slides: 'cec_tv_slides',
  officeHours: 'cec_tv_office_hours',
  roomSchedule: 'cec_tv_room_schedule',
  announcements: 'cec_tv_announcements',
  flashItems: 'cec_tv_flash_items',
  carouselSettings: 'cec_tv_carousel_settings'
};

// ---- Default Data ----
const DEFAULT_DATA = {
  slides: [
    // Example slide — admin can add more
    {
      id: 'default-1',
      type: 'image',
      url: 'https://scontent.fceb2-2.fna.fbcdn.net/v/t39.30808-6/461898993_122183102274116912_7784866127457844260_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xyz&_nc_oc=xyz&_nc_ht=scontent.fceb2-2.fna&oh=00_AYAAAA&oe=66FF',
      caption: 'Welcome to CEC IT Department',
      duration: 10,
      loop: true
    }
  ],
  officeHours: {
    name: 'Dean\'s Office',
    room: 'IT Building',
    time: '8:00 AM – 5:00 PM',
    status: 'available',
    initials: 'DO'
  },
  roomSchedule: [
    { id: 'r1', room: 'OCT 05', event: 'Midterm Hands-on Exam', instructor: 'ComLab 1 & 2', time: '08:00 - 12:00' },
    { id: 'r2', room: 'OCT 14', event: 'Web Systems Workshop', instructor: 'Multimedia Hall', time: '13:00 - 16:00' },
    { id: 'r3', room: 'OCT 22', event: 'Departmental Assembly', instructor: 'CEC Gymnasium', time: '09:00 - 11:30' },
    { id: 'r4', room: 'OCT 28', event: 'Capstone Project Pre-Oral', instructor: 'IT Conf. Room', time: '13:00 - 17:00' }
  ],
  announcements: [
    { id: 'a1', text: 'Midterm examinations schedule for 1st Semester 2026-2027 officially posted.', priority: 'high' },
    { id: 'a2', text: 'All IT students are reminded to wear formal departmental attire on Wednesdays.', priority: 'medium' }
  ],
  flashItems: [
    { id: 'f1', text: 'Welcome to Cebu Eastern College — College of Information Technology Digital Signage' },
    { id: 'f2', text: 'Visit the Admin CMS to manage slides, schedules, and announcements' }
  ],
  carouselSettings: {
    duration: 10,
    autoRotate: true
  }
};

// ---- Google Apps Script Cloud Storage Endpoint ----
const APPS_SCRIPT_ID = 'AKfycbxrc1f7iZjQJFGBGFPKL17YJ4ubV3WZ6ZwWC3zWSXALnSmWDPvnwyoOaLz5QXHheSSH';
const APPS_SCRIPT_URL = `https://script.google.com/macros/s/${APPS_SCRIPT_ID}/exec`;

// ---- In-Memory Fast Cache for Low-Connection / Smart TV Performance ----
const memoryDataCache = new Map();

function invalidateDataCache(key) {
  if (key) {
    memoryDataCache.delete(key);
  } else {
    memoryDataCache.clear();
  }
}

// ---- Data Management ----
function getData(key) {
  if (memoryDataCache.has(key)) {
    return memoryDataCache.get(key);
  }
  try {
    const raw = localStorage.getItem(DATA_KEYS[key]);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryDataCache.set(key, parsed);
      return parsed;
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
  }
  const fallback = DEFAULT_DATA[key];
  memoryDataCache.set(key, fallback);
  return fallback;
}

function setData(key, value) {
  memoryDataCache.set(key, value);
  try {
    localStorage.setItem(DATA_KEYS[key], JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage:`, e);
  }
  // Asynchronously synchronize changes to Google Apps Script cloud storage
  syncKeyToCloud(key, value);
}

// Update UI sync badge if present
function updateCloudBadge(status, text) {
  const badge = document.getElementById('cloud-sync-badge');
  const icon = document.getElementById('cloud-sync-icon');
  const label = document.getElementById('cloud-sync-text');
  if (!badge) return;

  if (status === 'syncing') {
    badge.style.background = 'rgba(252,163,17,0.14)';
    badge.style.borderColor = 'rgba(252,163,17,0.30)';
    badge.style.color = 'var(--accent-warm)';
    if (icon) icon.textContent = 'sync';
    if (label) label.textContent = text || 'Syncing to Cloud...';
  } else if (status === 'error') {
    badge.style.background = 'rgba(255,87,87,0.14)';
    badge.style.borderColor = 'rgba(255,87,87,0.30)';
    badge.style.color = 'var(--status-alert)';
    if (icon) icon.textContent = 'cloud_off';
    if (label) label.textContent = text || 'Sync Saved Locally';
  } else {
    badge.style.background = 'rgba(49,210,156,0.12)';
    badge.style.borderColor = 'rgba(49,210,156,0.25)';
    badge.style.color = '#31d29c';
    if (icon) icon.textContent = 'cloud_done';
    if (label) label.textContent = text || 'Cloud Synced';
  }
}

// Sync single key change to Google Apps Script
async function syncKeyToCloud(key, value) {
  updateCloudBadge('syncing', 'Saving to Cloud...');
  try {
    const payload = {
      action: 'save',
      key: key,
      data: value,
      updatedAt: new Date().toISOString()
    };

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // standard for Google Apps Script Web Apps
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    updateCloudBadge('synced', 'Cloud Synced');
  } catch (err) {
    console.warn('Apps Script cloud sync warning (saved in local cache):', err);
    updateCloudBadge('error', 'Saved Locally');
  }
}

// Fetch all site data from Google Apps Script on startup or interval
async function fetchCloudData(onUpdatedCallback) {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getAll&t=${Date.now()}`);
    if (!res.ok) return;
    const json = await res.json();
    if (json && typeof json === 'object') {
      let changed = false;
      for (const [key, storageKey] of Object.entries(DATA_KEYS)) {
        if (json[key] !== undefined) {
          // If cloud has records, or if it's an object/array with values
          const cloudVal = json[key];
          const hasCloudRecords = Array.isArray(cloudVal) ? cloudVal.length > 0 : (cloudVal && Object.keys(cloudVal).length > 0);
          
          if (hasCloudRecords) {
            memoryDataCache.set(key, cloudVal);
            localStorage.setItem(storageKey, JSON.stringify(cloudVal));
            changed = true;
          } else {
            // Cloud is empty for this key; seed initial local default to cloud if present
            const localVal = getData(key);
            if (localVal && (Array.isArray(localVal) ? localVal.length > 0 : true)) {
              syncKeyToCloud(key, localVal);
            }
          }
        }
      }
      if (changed && typeof onUpdatedCallback === 'function') {
        onUpdatedCallback();
      }
      updateCloudBadge('synced', 'Cloud Synced');
    }
  } catch (e) {
    // Apps Script standby or offline; graceful fallback to local cache
    console.info('Using locally cached data (Apps Script endpoint standby).');
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Helper: Determine media type from URL or explicit type
function detectMediaType(url) {
  if (!url) return 'image';
  const clean = url.trim().toLowerCase();
  if (clean.includes('youtube.com/') || clean.includes('youtu.be/') || clean.includes('vimeo.com/')) {
    return 'video';
  }
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov') || clean.includes('.mp4?') || clean.includes('.webm?')) {
    return 'video';
  }
  return 'image';
}

// Helper: Convert video URL to embed URL if YouTube or Vimeo
function parseVideoEmbedUrl(url, autoplay = true, loop = true) {
  if (!url) return '';
  const u = url.trim();

  // YouTube match
  // https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID or embed
  const ytMatch = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const vidId = ytMatch[1];
    const loopParam = loop ? `&loop=1&playlist=${vidId}` : '';
    return `https://www.youtube.com/embed/${vidId}?autoplay=${autoplay ? 1 : 0}&mute=1&controls=0&modestbranding=1&rel=0${loopParam}`;
  }

  // Vimeo match
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const vId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${vId}?autoplay=${autoplay ? 1 : 0}&muted=1&loop=${loop ? 1 : 0}&autopause=0&controls=0`;
  }

  return u;
}

// ---- Clock ----
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hoursEl = document.getElementById('clock-hours');
  const minutesEl = document.getElementById('clock-minutes');
  const ampmEl = document.getElementById('clock-ampm');
  const dayEl = document.getElementById('date-day');
  const fullDateEl = document.getElementById('date-full');

  if (hoursEl) hoursEl.textContent = hours;
  if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
  if (ampmEl) ampmEl.textContent = ampm;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  if (dayEl) dayEl.textContent = days[now.getDay()];
  if (fullDateEl) fullDateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

// ---- Weather API (Open-Meteo, No Key Required) ----
// Cebu City, Colon-Carbon area: ~10.2942, 123.8997
const WEATHER_LAT = 10.2942;
const WEATHER_LON = 123.8997;
const WEATHER_API = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FManila`;

// WMO Weather interpretation codes to icon + description + animated GIF
const WEATHER_CODES = {
  0: { icon: 'sunny', desc: 'Clear Sky', gif: 'assets/weather/sunny.gif' },
  1: { icon: 'sunny', desc: 'Mainly Clear', gif: 'assets/weather/sunny.gif' },
  2: { icon: 'partly_cloudy_day', desc: 'Partly Cloudy', gif: 'assets/weather/partly-cloudy.gif' },
  3: { icon: 'cloud', desc: 'Overcast', gif: 'assets/weather/overcast.gif' },
  45: { icon: 'foggy', desc: 'Fog', gif: 'assets/weather/overcast.gif' },
  48: { icon: 'foggy', desc: 'Rime Fog', gif: 'assets/weather/overcast.gif' },
  51: { icon: 'rainy', desc: 'Light Drizzle', gif: 'assets/weather/rain.gif' },
  53: { icon: 'rainy', desc: 'Moderate Drizzle', gif: 'assets/weather/rain.gif' },
  55: { icon: 'rainy', desc: 'Dense Drizzle', gif: 'assets/weather/rain.gif' },
  61: { icon: 'rainy', desc: 'Light Rain', gif: 'assets/weather/rain.gif' },
  63: { icon: 'rainy', desc: 'Moderate Rain', gif: 'assets/weather/rain.gif' },
  65: { icon: 'rainy', desc: 'Heavy Rain', gif: 'assets/weather/rain.gif' },
  71: { icon: 'weather_snowy', desc: 'Light Snow', gif: 'assets/weather/overcast.gif' },
  73: { icon: 'weather_snowy', desc: 'Moderate Snow', gif: 'assets/weather/overcast.gif' },
  75: { icon: 'weather_snowy', desc: 'Heavy Snow', gif: 'assets/weather/overcast.gif' },
  80: { icon: 'rainy', desc: 'Light Showers', gif: 'assets/weather/rain.gif' },
  81: { icon: 'rainy', desc: 'Moderate Showers', gif: 'assets/weather/rain.gif' },
  82: { icon: 'thunderstorm', desc: 'Heavy Showers', gif: 'assets/weather/rain.gif' },
  95: { icon: 'thunderstorm', desc: 'Thunderstorm', gif: 'assets/weather/thunderstorm.gif' },
  96: { icon: 'thunderstorm', desc: 'Thunderstorm + Hail', gif: 'assets/weather/thunderstorm.gif' },
  99: { icon: 'thunderstorm', desc: 'Severe Thunderstorm', gif: 'assets/weather/thunderstorm.gif' }
};

async function fetchWeather() {
  const bgEl = document.getElementById('weather-animated-bg');
  const iconEl = document.getElementById('weather-icon');
  const tempEl = document.getElementById('weather-temp');
  const windEl = document.getElementById('weather-wind');
  const descEl = document.getElementById('weather-desc');
  const locEl = document.getElementById('weather-location');

  try {
    const res = await fetch(WEATHER_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current;

    const code = current.weather_code;
    const weatherInfo = WEATHER_CODES[code] || { icon: 'cloud', desc: 'Partly Cloudy', gif: 'assets/weather/partly-cloudy.gif' };

    const tempVal = Math.round(current.temperature_2m);
    const windVal = Math.round(current.wind_speed_10m || 14);

    if (iconEl) iconEl.textContent = weatherInfo.icon;
    if (tempEl) tempEl.textContent = `${tempVal}°C`;
    if (windEl) windEl.textContent = `${windVal} KM/H`;
    if (descEl) descEl.textContent = `${weatherInfo.desc} · ${current.relative_humidity_2m}% Humidity`;
    if (locEl) locEl.textContent = 'CEBU CITY · LEON KILAT ST.';

    if (bgEl && weatherInfo.gif) {
      bgEl.style.backgroundImage = `url('${weatherInfo.gif}')`;
    }

  } catch (err) {
    console.warn('Weather fetch failed:', err);
    if (tempEl) tempEl.textContent = '28°C';
    if (windEl) windEl.textContent = '14 KM/H';
    if (descEl) descEl.textContent = 'Thunderstorm · 86% Humidity';
    if (locEl) locEl.textContent = 'CEBU CITY · LEON KILAT ST.';
    if (bgEl) bgEl.style.backgroundImage = "url('assets/weather/thunderstorm.gif')";
  }
}

function startWeather() {
  fetchWeather();
  // Refresh every 15 minutes
  setInterval(fetchWeather, 15 * 60 * 1000);
}
