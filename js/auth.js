/*
  Tripofreak Auth Service — Supabase Google OAuth
  ─────────────────────────────────────────────────
  SETUP: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your real values
  from Supabase dashboard → Settings → API
*/

const SUPABASE_URL = 'https://zzbmtijiqfunvngbrbso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym10aWppcWZ1bnZuZ2JyYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTQzMDMsImV4cCI6MjA5NzAzMDMwM30.x3iiz5nmnIG0tMe_tCLeOOMs7jvx3miZxLXf1rhgZBk';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let authStateCallbacks = [];

async function initAuth() {
  // Handle OAuth callback — Supabase puts tokens in URL hash after redirect
  const { data: { session }, error } = await _supabase.auth.getSession();
  currentUser = session?.user || null;

  // Listen for auth state changes
  _supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    authStateCallbacks.forEach(cb => cb(currentUser, event));
    // Update nav immediately on any auth change
    updateNavUser(currentUser);
  });

  // Update nav on load
  updateNavUser(currentUser);
  return currentUser;
}

async function signInWithGoogle() {
  const { data, error } = await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://tripofreak.com',
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  });
  if (error) throw new Error(error.message);
  return data;
}

async function signOut() {
  await _supabase.auth.signOut();
  currentUser = null;
  updateNavUser(null);
  window.location.href = '/';
}

function getUser() { return currentUser; }
function isLoggedIn() { return !!currentUser; }
function onAuthChange(cb) { authStateCallbacks.push(cb); }

function getUserInfo() {
  if (!currentUser) return null;
  return {
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
    avatar: currentUser.user_metadata?.avatar_url || null
  };
}

// ── Login Modal ───────────────────────────────────────────────────────
function showLoginModal(onSuccessCallback) {
  const existing = document.getElementById('tf-login-modal');
  if (existing) existing.remove();

  // Inject styles once
  if (!document.getElementById('tf-login-styles')) {
    const style = document.createElement('style');
    style.id = 'tf-login-styles';
    style.textContent = `
      #tf-login-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s}
      #tf-login-modal.visible{opacity:1}
      .lm-backdrop{position:absolute;inset:0;background:rgba(12,12,10,0.8);backdrop-filter:blur(6px)}
      .lm-card{position:relative;z-index:1;background:#fff;border-radius:20px;padding:2rem 1.75rem;width:90%;max-width:380px;box-shadow:0 24px 64px rgba(12,12,10,0.3);transform:translateY(12px);transition:transform .25s}
      #tf-login-modal.visible .lm-card{transform:translateY(0)}
      .lm-close{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:50%;border:none;background:#F5F0E8;color:#7A6A52;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer}
      .lm-logo{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#0C0C0A;margin-bottom:1rem;display:flex;align-items:center;gap:8px}
      .lm-logo-dots{display:flex;flex-direction:column;gap:3px}
      .lm-logo-dot{width:6px;height:6px;border-radius:50%}
      .lm-title{font-family:'Cormorant Garamond',serif;font-size:22px;color:#0C0C0A;margin-bottom:6px;line-height:1.2;font-weight:600}
      .lm-sub{font-size:12px;color:#7A6A52;line-height:1.6;margin-bottom:1.5rem}
      .lm-google-btn{width:100%;padding:13px 16px;border:1.5px solid rgba(12,12,10,0.12);border-radius:8px;background:#fff;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;color:#0C0C0A;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .15s;margin-bottom:1rem}
      .lm-google-btn:hover{background:#F5F0E8;border-color:rgba(12,12,10,0.2)}
      .lm-google-btn:disabled{opacity:0.6;cursor:not-allowed}
      .lm-divider{text-align:center;position:relative;margin-bottom:1rem}
      .lm-divider::before{content:'';position:absolute;top:50%;left:0;right:0;height:0.5px;background:rgba(12,12,10,0.08)}
      .lm-divider span{position:relative;background:#fff;padding:0 10px;font-size:10px;color:#B4A898}
      .lm-benefits{list-style:none;margin-bottom:1rem;display:flex;flex-direction:column;gap:7px}
      .lm-benefits li{display:flex;align-items:center;gap:8px;font-size:12px;color:#0C0C0A}
      .lm-benefits .check{color:#2A5C3A;font-size:14px}
      .lm-terms{font-size:10px;color:#B4A898;line-height:1.6;text-align:center}
      .lm-terms a{color:#7A6A52}
      .lm-spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(12,12,10,0.15);border-top-color:#0C0C0A;animation:lm-spin .7s linear infinite;flex-shrink:0}
      @keyframes lm-spin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(style);
  }

  const modal = document.createElement('div');
  modal.id = 'tf-login-modal';
  modal.innerHTML = `
    <div class="lm-backdrop" onclick="TF_AUTH.closeLoginModal()"></div>
    <div class="lm-card">
      <button class="lm-close" onclick="TF_AUTH.closeLoginModal()">✕</button>
      <div class="lm-logo">
        <div class="lm-logo-dots">
          <div class="lm-logo-dot" style="background:#E8C547"></div>
          <div class="lm-logo-dot" style="background:rgba(232,197,71,0.4)"></div>
          <div class="lm-logo-dot" style="background:#C84B2A"></div>
        </div>
        <span>Tripo<span style="color:#E8C547">freak</span></span>
      </div>
      <div class="lm-title">Sign in to plan your trip</div>
      <div class="lm-sub">Your itineraries are saved to your account. Access them from any device, any time.</div>
      <button class="lm-google-btn" id="lm-google-btn" onclick="TF_AUTH.handleGoogleLogin()">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.017 17.64 11.71 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
        Continue with Google
      </button>
      <div class="lm-divider"><span>Free forever — no credit card</span></div>
      <ul class="lm-benefits">
        <li><span class="check">✓</span>Every itinerary completely free</li>
        <li><span class="check">✓</span>All trips saved to your account</li>
        <li><span class="check">✓</span>Access from any device, any time</li>
        <li><span class="check">✓</span>Share trips with your travel group</li>
      </ul>
      <div class="lm-terms">By continuing you agree to our <a href="/pages/terms.html">Terms</a> and <a href="/pages/privacy.html">Privacy Policy</a>. We never post without your permission.</div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  if (onSuccessCallback) window._authSuccessCallback = onSuccessCallback;
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('visible')));
}

function closeLoginModal() {
  const modal = document.getElementById('tf-login-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => { modal.remove(); document.body.style.overflow = ''; }, 250);
}

async function handleGoogleLogin() {
  const btn = document.getElementById('lm-google-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="lm-spinner"></div> Connecting...'; }
  try {
    await signInWithGoogle();
  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Try again — ' + err.message; }
  }
}

// ── Nav user display ──────────────────────────────────────────────────
function updateNavUser(user) {
  const signinBtn = document.getElementById('nav-signin');
  const tripsBtn = document.getElementById('nav-trips');
  if (!signinBtn) return;

  if (user) {
    const info = getUserInfo();
    const firstName = info.name.split(' ')[0];
    signinBtn.textContent = firstName;
    signinBtn.href = '/pages/my-trips.html';
    signinBtn.onclick = null;
    // Add sign out option
    signinBtn.title = 'Click to go to My Trips';
    if (tripsBtn) tripsBtn.style.display = 'inline';
    // Add sign out link if not present
    if (!document.getElementById('nav-signout')) {
      const signout = document.createElement('a');
      signout.id = 'nav-signout';
      signout.href = '#';
      signout.textContent = 'Sign out';
      signout.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.4);text-decoration:none;';
      signout.onclick = (e) => { e.preventDefault(); TF_AUTH.signOut(); };
      signinBtn.parentNode.insertBefore(signout, signinBtn.nextSibling);
    }
  } else {
    signinBtn.textContent = 'Sign in';
    signinBtn.href = '#';
    signinBtn.onclick = (e) => { e.preventDefault(); showLoginModal(); };
    if (tripsBtn) tripsBtn.style.display = 'none';
    const signout = document.getElementById('nav-signout');
    if (signout) signout.remove();
  }
}

// ── Export ────────────────────────────────────────────────────────────
window.TF_AUTH = {
  init: initAuth,
  signInWithGoogle,
  signOut,
  getUser,
  isLoggedIn,
  getUserInfo,
  showLoginModal,
  closeLoginModal,
  handleGoogleLogin,
  onAuthChange,
  updateNavUser,
  supabase: _supabase
};
