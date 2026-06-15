/*
  Tripofreak Cookie Consent Banner
  ─────────────────────────────────
  GDPR / DPDPA / CCPA compliant.
  Add <script src="/js/cookie-consent.js"></script> to every HTML page.
  That's it. No other setup needed.

  What it does:
  - Shows a consent banner on first visit
  - Stores user choice in localStorage (not a cookie — no irony intended)
  - Respects "Do Not Track" browser setting automatically
  - Injects the banner CSS itself — no separate stylesheet needed
*/

(function () {
  const CONSENT_KEY = 'tf_cookie_consent';
  const CONSENT_VERSION = '1'; // Bump this when policy changes to re-ask

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #tf-cookie-banner {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 9998;
      background: #071510;
      border-top: 0.5px solid rgba(93,202,165,0.2);
      padding: 1rem 1.25rem;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    #tf-cookie-banner.visible { transform: translateY(0); }
    .cb-inner {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cb-text {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.65);
      line-height: 1.6;
    }
    .cb-text a {
      color: #5DCAA5;
      text-decoration: none;
    }
    .cb-text strong {
      color: #fff;
    }
    .cb-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cb-accept {
      background: #1A7A50;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
    }
    .cb-decline {
      background: transparent;
      color: rgba(255,255,255,0.5);
      border: 0.5px solid rgba(255,255,255,0.2);
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
    }
    .cb-accept:hover { background: #0D5538; }
    .cb-decline:hover { color: rgba(255,255,255,0.8); }
    @media (min-width: 600px) {
      .cb-inner { flex-direction: row; align-items: center; }
      .cb-text { flex: 1; }
    }
  `;
  document.head.appendChild(style);

  // Check existing consent
  function getConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Re-ask if version changed
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function setConsent(accepted) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted,
        version: CONSENT_VERSION,
        date: new Date().toISOString()
      }));
    } catch {}
  }

  function hideBanner() {
    const banner = document.getElementById('tf-cookie-banner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 350);
    }
  }

  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'tf-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cb-inner">
        <div class="cb-text">
          <strong>We use cookies</strong> — only essential ones for login and remembering your currency preference.
          We don't use advertising or tracking cookies. Read our
          <a href="/pages/privacy.html">Privacy Policy</a> for details.
        </div>
        <div class="cb-buttons">
          <button class="cb-accept" id="cb-accept-btn">Accept</button>
          <button class="cb-decline" id="cb-decline-btn">Decline non-essential</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('visible'));
    });

    document.getElementById('cb-accept-btn').addEventListener('click', () => {
      setConsent(true);
      hideBanner();
    });

    document.getElementById('cb-decline-btn').addEventListener('click', () => {
      setConsent(false);
      hideBanner();
      // No analytics or non-essential cookies — nothing to actually disable
      // This button exists for compliance, not because we use tracking cookies
    });
  }

  // Check Do Not Track browser setting
  function isDNTEnabled() {
    return navigator.doNotTrack === '1' ||
           window.doNotTrack === '1' ||
           navigator.msDoNotTrack === '1';
  }

  // Main logic
  function init() {
    // If DNT is enabled, respect it silently — no banner needed
    if (isDNTEnabled()) {
      setConsent(false);
      return;
    }

    const existing = getConsent();
    if (existing !== null) return; // Already decided

    // Show banner after short delay so page loads first
    setTimeout(showBanner, 1200);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for settings page use
  window.TF_COOKIE = {
    getConsent,
    resetConsent: () => {
      localStorage.removeItem(CONSENT_KEY);
      showBanner();
    }
  };
})();
