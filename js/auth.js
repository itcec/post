/* ================================================================
   AUTH MODULE
   Login authentication with SHA-256 hashed password
   ================================================================ */

// Hashed credentials (SHA-256)
const AUTH_CONFIG = {
  username: 'itcec',
  // SHA-256 hash of 'itcec2026'
  passwordHash: '78762f95f111431973384aa1dab9c8a6139638d188a4e2b5ed096591037170c6'
};

const AUTH_SESSION_KEY = 'cec_tv_auth_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// ---- SHA-256 Hash using Web Crypto API ----
async function sha256(message) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error:', e);
  }
  return null;
}

// ---- Session Management ----
function isAuthenticated() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
    if (session && session.loggedIn && session.expiry > Date.now()) {
      return true;
    }
  } catch (e) {}
  localStorage.removeItem(AUTH_SESSION_KEY);
  return false;
}

function createSession() {
  const session = {
    loggedIn: true,
    user: AUTH_CONFIG.username,
    expiry: Date.now() + SESSION_DURATION,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function destroySession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

// ---- Login Validation ----
async function validateLogin(username, password) {
  const user = (username || '').trim().toLowerCase();
  const pass = (password || '').trim();

  if (user !== AUTH_CONFIG.username.toLowerCase()) return false;

  const hash = await sha256(pass);
  if (hash) {
    return hash === AUTH_CONFIG.passwordHash;
  }
  // Fallback in case Web Crypto API is unavailable in insecure contexts or older browsers
  return pass === 'itcec2026';
}

// ---- Logout ----
function logout() {
  destroySession();
  window.location.href = 'admin.html';
}

