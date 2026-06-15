/*
  ─── Tripofreak Auth Service ─────────────────────────────────────────────
  Uses Supabase Auth with Google OAuth.

  SETUP STEPS (do these once in your Supabase dashboard):
  1. Go to: https://supabase.com/dashboard → your project → Authentication → Providers
  2. Enable Google provider
  3. Go to: https://console.cloud.google.com
     - Create project "Tripofreak"
     - APIs & Services → Credentials → Create OAuth 2.0 Client ID
     - Application type: Web application
     - Authorised redirect URIs: https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
     - Copy Client ID and Client Secret → paste into Supabase Google provider settings
  4. In Supabase → Authentication → URL Configuration:
     - Site URL: https://tripofreak.com
     - Redirect URLs: https://tripofreak.com, https://tripofreak.com/itinerary.html
  ─────────────────────────────────────────────────────────────────────────
*/

// Your Supabase project credentials (safe to expose — RLS protects data)
// Replace these with your actual values from Supabase dashboard → Settings → API
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

// Load Supabase client from CDN (loaded in HTML before this script)
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth state ───────────────────────────────────────────────────────
let currentUser = null;
let authStateCallbacks = [];

// ─── Init — check session on page load ───────────────────────────────
async function initAuth() {
  // Get current session
  const { data: { session } } = await _supabase.auth.getSession();
  currentUser = session?.user || null;

  // Listen for auth changes (login, logout, token refresh)
  _supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    authStateCallbacks.forEach(cb => cb(currentUser, event));
  });

  return currentUser;
}

// ─── Google Sign In ───────────────────────────────────────────────────
async function signInWithGoogle(redirectTo = null) {
  const { data, error } = await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || window.location.href,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Sign out ─────────────────────────────────────────────────────────
async function signOut() {
  const { error } = await _supabase.auth.signOut();
  if (error) throw new Error(error.message);
  currentUser = null;
  window.location.href = '/';
}

// ─── Get current user ─────────────────────────────────────────────────
function getUser() { return currentUser; }

function isLoggedIn() { return !!currentUser; }

// ─── Subscribe to auth changes ────────────────────────────────────────
function onAuthChange(callback) {
  authStateCallbacks.push(callback);
}

// ─── Get user display info ────────────────────────────────────────────
function getUserInfo() {
  if (!currentUser) return null;
  return {
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.user_metadata?.full_name || currentUser.email,
    avatar: currentUser.user_metadata?.avatar_url || null,
    provider: currentUser.app_metadata?.provider || 'google'
  };
}

// ─── Require auth — call this on pages that need login ───────────────
// Returns the user if logged in, otherwise shows login modal
async function requireAuth(onSuccess) {
  const user = await initAuth();
  if (user) {
    if (onSuccess) onSuccess(user);
    return user;
  }
  // Not logged in — show modal
  showLoginModal(onSuccess);
  return null;
}

// ─── Login modal ──────────────────────────────────────────────────────
function showLoginModal(onSuccessCallback) {
  // Remove existing modal if any
  const existing = document.getElementById('tf-login-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'tf-login-modal';
  modal.innerHTML = `
    <div class="lm-backdrop" onclick="closeLoginModal()"></div>
    <div class="lm-card" role="dialog" aria-modal="true" aria-label="Sign in to Tripofreak">
      <button class="lm-close" onclick="closeLoginModal()" aria-label="Close">
        <i class="ti ti-x"></i>
      </button>
      <div class="lm-logo">
        <i class="ti ti-map-2"></i>
        Tripo<span>freak</span>
      </div>
      <h2 class="lm-title">Sign in to plan your trip</h2>
      <p class="lm-sub">Your itineraries are saved to your account. Access them from any device, any time.</p>

      <button class="lm-google-btn" id="lm-google-btn" onclick="handleGoogleLogin()">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div class="lm-divider"><span>Free to start</span></div>

      <ul class="lm-benefits">
        <li><i class="ti ti-check"></i>Day 1 itinerary free — no credit card</li>
        <li><i class="ti ti-check"></i>All trips saved to your account</li>
        <li><i class="ti ti-check"></i>Access from any device, any time</li>
        <li><i class="ti ti-check"></i>Unlock full trips from ₹99 / $1.49</li>
      </ul>

      <p class="lm-terms">
        By continuing you agree to our
        <a href="/pages/terms.html" target="_blank">Terms</a> and
        <a href="/pages/privacy.html" target="_blank">Privacy Policy</a>.
        We never post without your permission.
      </p>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Store callback for after login
  if (onSuccessCallback) {
    window._authSuccessCallback = onSuccessCallback;
  }

  // Animate in
  requestAnimationFrame(() => modal.classList.add('visible'));
}

function closeLoginModal() {
  const modal = document.getElementById('tf-login-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => {
    modal.remove();
    document.body.style.overflow = '';
  }, 250);
}

async function handleGoogleLogin() {
  const btn = document.getElementById('lm-google-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="lm-spinner"></div> Connecting to Google...`;
  }

  try {
    // After Google OAuth, Supabase redirects back to current page
    // The auth state listener picks up the session automatically
    await signInWithGoogle();
    // Note: page will redirect to Google, then back — no code runs after this
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg>...</svg> Try again — ${err.message}`;
    }
  }
}

// ─── Login modal CSS — injected once ─────────────────────────────────
(function injectLoginStyles() {
  if (document.getElementById('tf-login-styles')) return;
  const style = document.createElement('style');
  style.id = 'tf-login-styles';
  style.textContent = `
    #tf-login-modal {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .25s;
    }
    #tf-login-modal.visible { opacity: 1; }
    .lm-backdrop {
      position: absolute; inset: 0;
      background: rgba(7,21,16,0.75);
      backdrop-filter: blur(4px);
    }
    .lm-card {
      position: relative; z-index: 1;
      background: #fff; border-radius: 20px;
      padding: 2rem 1.5rem;
      width: 90%; max-width: 360px;
      box-shadow: 0 24px 64px rgba(7,21,16,0.25);
      transform: translateY(8px);
      transition: transform .25s;
    }
    #tf-login-modal.visible .lm-card { transform: translateY(0); }
    .lm-close {
      position: absolute; top: 14px; right: 14px;
      width: 30px; height: 30px; border-radius: 50%;
      border: none; background: #F2FAF6;
      color: #4A7060; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .lm-logo {
      font-family: 'Playfair Display', serif;
      font-size: 20px; font-weight: 600;
      color: #071510; margin-bottom: 1rem;
      display: flex; align-items: center; gap: 6px;
    }
    .lm-logo .ti { color: #5DCAA5; font-size: 20px; }
    .lm-logo span { color: #E8A830; }
    .lm-title {
      font-family: 'Playfair Display', serif;
      font-size: 19px; color: #071510;
      margin-bottom: 6px; line-height: 1.2;
    }
    .lm-sub { font-size: 12px; color: #4A7060; line-height: 1.5; margin-bottom: 1.5rem; }
    .lm-google-btn {
      width: 100%; padding: 12px 16px;
      border: 1px solid #C0E0D0; border-radius: 10px;
      background: #fff; cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; font-weight: 500; color: #071510;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: background .15s, border-color .15s;
      margin-bottom: 1rem;
    }
    .lm-google-btn:hover { background: #F2FAF6; border-color: #5DCAA5; }
    .lm-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .lm-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid #C0E0D0;
      border-top-color: #1A7A50;
      animation: spin .7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .lm-divider {
      text-align: center; position: relative; margin-bottom: 1rem;
    }
    .lm-divider::before {
      content: ''; position: absolute;
      top: 50%; left: 0; right: 0; height: 0.5px;
      background: rgba(7,21,16,0.08);
    }
    .lm-divider span {
      position: relative; background: #fff;
      padding: 0 10px; font-size: 10px; color: #8BA898;
    }
    .lm-benefits {
      list-style: none; margin-bottom: 1rem;
      display: flex; flex-direction: column; gap: 6px;
    }
    .lm-benefits li {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #071510;
    }
    .lm-benefits .ti { color: #1A7A50; font-size: 14px; flex-shrink: 0; }
    .lm-terms {
      font-size: 10px; color: #8BA898; line-height: 1.6; text-align: center;
    }
    .lm-terms a { color: #4A7060; }
  `;
  document.head.appendChild(style);
})();

// ─── User avatar in nav ───────────────────────────────────────────────
function updateNavUser(user) {
  const navR = document.querySelector('.nav-r');
  if (!navR) return;

  // Remove existing user element
  const existing = document.getElementById('nav-user');
  if (existing) existing.remove();

  const premiumBtn = document.getElementById('nav-premium');

  if (user) {
    const info = getUserInfo();
    const userEl = document.createElement('div');
    userEl.id = 'nav-user';
    userEl.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;position:relative';
    userEl.innerHTML = `
      <div style="position:relative" onclick="toggleUserMenu()">
        ${info.avatar
          ? `<img src="${info.avatar}" alt="${info.name}" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(93,202,165,0.4);object-fit:cover">`
          : `<div style="width:28px;height:28px;border-radius:50%;background:#1A7A50;color:#fff;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center;border:2px solid rgba(93,202,165,0.4)">${info.name.charAt(0).toUpperCase()}</div>`
        }
      </div>
      <div id="user-menu" style="display:none;position:absolute;top:38px;right:0;background:#fff;border-radius:10px;border:0.5px solid rgba(7,21,16,0.08);box-shadow:0 8px 24px rgba(7,21,16,0.12);min-width:180px;z-index:200;overflow:hidden">
        <div style="padding:10px 12px;border-bottom:0.5px solid rgba(7,21,16,0.06)">
          <div style="font-size:12px;font-weight:500;color:#071510">${info.name}</div>
          <div style="font-size:10px;color:#4A7060">${info.email}</div>
        </div>
        <a href="/pages/my-trips.html" style="display:flex;align-items:center;gap:8px;padding:9px 12px;font-size:12px;color:#071510;text-decoration:none;border-bottom:0.5px solid rgba(7,21,16,0.06)"><i class="ti ti-map-2" style="font-size:14px;color:#1A7A50"></i>My trips</a>
        <button onclick="signOut()" style="width:100%;padding:9px 12px;border:none;background:none;display:flex;align-items:center;gap:8px;font-size:12px;color:#C85A1A;cursor:pointer;font-family:'DM Sans',sans-serif"><i class="ti ti-logout" style="font-size:14px"></i>Sign out</button>
      </div>
    `;

    // Hide premium button when logged in (or change to "My Trips")
    if (premiumBtn) premiumBtn.style.display = 'none';
    navR.appendChild(userEl);

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!userEl.contains(e.target)) {
        document.getElementById('user-menu')?.style.setProperty('display', 'none');
      }
    });
  } else {
    // Not logged in — show premium button
    if (premiumBtn) premiumBtn.style.display = '';
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// ─── Export for use across pages ──────────────────────────────────────
window.TF_AUTH = {
  init: initAuth,
  signInWithGoogle,
  signOut,
  getUser,
  isLoggedIn,
  getUserInfo,
  requireAuth,
  showLoginModal,
  closeLoginModal,
  onAuthChange,
  updateNavUser,
  supabase: _supabase
};
