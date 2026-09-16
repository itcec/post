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
      url: 'https://scontent.fceb2-2.fna.fbcdn.net/v/t39.30808-6/461898993_122183102274116912_7784866127457844260_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xyz&_nc_oc=xyz&_nc_ht=scontent.fceb2-2.fna&oh=00_AYAAAA&oe=66FF',
      caption: 'Welcome to CEC IT Department'
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
    { id: 'r1', room: 'Lab 1', event: 'IT 101 - Intro to Computing', instructor: 'Prof. Santos', time: '8:00 AM' },
    { id: 'r2', room: 'Lab 2', event: 'IT 201 - Data Structures', instructor: 'Prof. Cruz', time: '10:00 AM' },
    { id: 'r3', room: 'Lab 3', event: 'IT 301 - Web Development', instructor: 'Prof. Reyes', time: '1:00 PM' }
  ],
  announcements: [
    { id: 'a1', text: 'Welcome to CEC College of Information Technology! Check the admin panel to add announcements.', priority: 'high' }
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

// ---- Data Management ----
function getData(key) {
  try {
    const raw = localStorage.getItem(DATA_KEYS[key]);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
  }
  return DEFAULT_DATA[key];
}

function setData(key, value) {
  try {
    localStorage.setItem(DATA_KEYS[key], JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage:`, e);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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
const WEATHER_API = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FManila`;

// WMO Weather interpretation codes to icon + description
const WEATHER_CODES = {
  0: { icon: 'sunny', desc: 'Clear Sky' },
  1: { icon: 'sunny', desc: 'Mainly Clear' },
  2: { icon: 'partly_cloudy_day', desc: 'Partly Cloudy' },
  3: { icon: 'cloud', desc: 'Overcast' },
  45: { icon: 'foggy', desc: 'Fog' },
  48: { icon: 'foggy', desc: 'Rime Fog' },
  51: { icon: 'rainy', desc: 'Light Drizzle' },
  53: { icon: 'rainy', desc: 'Moderate Drizzle' },
  55: { icon: 'rainy', desc: 'Dense Drizzle' },
  61: { icon: 'rainy', desc: 'Light Rain' },
  63: { icon: 'rainy', desc: 'Moderate Rain' },
  65: { icon: 'rainy', desc: 'Heavy Rain' },
  71: { icon: 'weather_snowy', desc: 'Light Snow' },
  73: { icon: 'weather_snowy', desc: 'Moderate Snow' },
  75: { icon: 'weather_snowy', desc: 'Heavy Snow' },
  80: { icon: 'rainy', desc: 'Light Showers' },
  81: { icon: 'rainy', desc: 'Moderate Showers' },
  82: { icon: 'thunderstorm', desc: 'Heavy Showers' },
  95: { icon: 'thunderstorm', desc: 'Thunderstorm' },
  96: { icon: 'thunderstorm', desc: 'Thunderstorm + Hail' },
  99: { icon: 'thunderstorm', desc: 'Severe Thunderstorm' }
};

async function fetchWeather() {
  try {
    const res = await fetch(WEATHER_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current;

    const code = current.weather_code;
    const weatherInfo = WEATHER_CODES[code] || { icon: 'cloud', desc: 'Unknown' };

    const iconEl = document.getElementById('weather-icon');
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    const locEl = document.getElementById('weather-location');

    if (iconEl) iconEl.textContent = weatherInfo.icon;
    if (tempEl) tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    if (descEl) descEl.textContent = `${weatherInfo.desc} · ${current.relative_humidity_2m}% Humidity`;
    if (locEl) locEl.textContent = 'Cebu City · Colon-Carbon';

  } catch (err) {
    console.warn('Weather fetch failed:', err);
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    if (tempEl) tempEl.textContent = '--°C';
    if (descEl) descEl.textContent = 'Weather unavailable';
  }
}

function startWeather() {
  fetchWeather();
  // Refresh every 15 minutes
  setInterval(fetchWeather, 15 * 60 * 1000);
}
