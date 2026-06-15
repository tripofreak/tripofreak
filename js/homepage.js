/* ─── Tripofreak Homepage JS ─────────────────────────────────────────── */

// ─── Slideshow ────────────────────────────────────────────────────────
const SLIDES = document.querySelectorAll('.slide');
const DOTS = document.querySelectorAll('.dot');
const DEST_NAMES = [
  'Ladakh, India',
  'Kyoto, Japan',
  'Santorini, Greece',
  'Dubai, UAE',
  'Patagonia, Argentina'
];
let currentSlide = 0;
let slideTimer;

function goSlide(n) {
  SLIDES[currentSlide].classList.remove('active');
  DOTS[currentSlide].classList.remove('active');
  currentSlide = n;
  SLIDES[currentSlide].classList.add('active');
  DOTS[currentSlide].classList.add('active');
  document.getElementById('dest-name').textContent = DEST_NAMES[currentSlide];
  clearInterval(slideTimer);
  slideTimer = setInterval(nextSlide, 5000);
}

function nextSlide() { goSlide((currentSlide + 1) % SLIDES.length); }
slideTimer = setInterval(nextSlide, 5000);

// ─── Nav scroll behaviour ─────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ─── Trending ticker ──────────────────────────────────────────────────
const TRENDING = [
  { flag: '🇫🇷', name: 'Paris', vol: '2.4M searches' },
  { flag: '🇮🇩', name: 'Bali', vol: '2.1M searches' },
  { flag: '🇯🇵', name: 'Tokyo', vol: '1.9M searches' },
  { flag: '🇦🇪', name: 'Dubai', vol: '1.8M searches' },
  { flag: '🇮🇳', name: 'Goa', vol: '1.6M searches' },
  { flag: '🇮🇹', name: 'Rome', vol: '1.5M searches' },
  { flag: '🇹🇭', name: 'Bangkok', vol: '1.4M searches' },
  { flag: '🇲🇻', name: 'Maldives', vol: '1.3M searches' },
  { flag: '🇪🇸', name: 'Barcelona', vol: '1.2M searches' },
  { flag: '🇺🇸', name: 'New York', vol: '1.1M searches' },
  { flag: '🇮🇳', name: 'Manali', vol: '980K searches' },
  { flag: '🇬🇷', name: 'Santorini', vol: '940K searches' },
  { flag: '🇸🇬', name: 'Singapore', vol: '920K searches' },
  { flag: '🇮🇳', name: 'Ladakh', vol: '890K searches' },
  { flag: '🇬🇧', name: 'London', vol: '870K searches' },
  { flag: '🇮🇳', name: 'Jaipur', vol: '820K searches' },
  { flag: '🇵🇹', name: 'Lisbon', vol: '780K searches' },
  { flag: '🇯🇵', name: 'Kyoto', vol: '750K searches' },
  { flag: '🇲🇦', name: 'Morocco', vol: '720K searches' },
  { flag: '🇮🇳', name: 'Vaishno Devi', vol: '700K searches' },
];

function buildTicker() {
  const track = document.getElementById('ticker-track');
  // Double the items for seamless loop
  const allItems = [...TRENDING, ...TRENDING];
  track.innerHTML = allItems.map(item => `
    <div class="tick-item" onclick="setDestAndOpen('${item.name}')">
      <span class="tick-flag">${item.flag}</span>
      ${item.name}
      <span class="tick-vol">${item.vol}</span>
    </div>
  `).join('');
}

buildTicker();

// ─── Search form logic ────────────────────────────────────────────────
function handleSearch(e) {
  if (e) e.preventDefault();
  const dest = document.getElementById('dest-input').value.trim();
  if (!dest) {
    document.getElementById('dest-input').focus();
    return;
  }
  openFormExpansion(dest);
}

function setDestAndOpen(dest) {
  document.getElementById('dest-input').value = dest;
  openFormExpansion(dest);
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
}

function openFormExpansion(dest) {
  const expansion = document.getElementById('form-expansion');
  const display = document.getElementById('form-dest-display');
  display.innerHTML = `Planning your trip to <span>${dest}</span>`;
  expansion.style.display = 'block';
  setTimeout(() => {
    expansion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ─── Interest chip toggle ─────────────────────────────────────────────
document.querySelectorAll('.ichip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('active'));
});

// ─── Generate itinerary ───────────────────────────────────────────────
async function generateItinerary() {
  const destination = document.getElementById('dest-input').value.trim();
  if (!destination) return;

  const params = {
    destination,
    startDate: document.getElementById('f-date').value || null,
    days: parseInt(document.getElementById('f-days').value),
    budgetCategory: document.getElementById('f-budget').value,
    pace: document.getElementById('f-pace').value,
    groupType: document.getElementById('f-group').value,
    groupSize: parseInt(document.getElementById('f-size').value),
    interests: [...document.querySelectorAll('.ichip.active')].map(c => c.dataset.val),
    dietary: document.getElementById('f-diet').value,
    mobility: document.getElementById('f-mobility').value
  };

  showLoading(destination);

  try {
    const res = await fetch(`${CONFIG.API_URL}/api/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Generation failed');
    }

    const data = await res.json();

    // Store in sessionStorage for the itinerary page
    sessionStorage.setItem('tf_itinerary', JSON.stringify(data));

    // Redirect to itinerary page
    window.location.href = `itinerary.html?id=${data.itineraryId}`;

  } catch (err) {
    hideLoading();
    showError(err.message);
  }
}

// ─── Loading state ─────────────────────────────────────────────────────
const loadingMessages = [
  'Analysing your destination...',
  'Clustering activities by proximity...',
  'Detecting Freaky Finds...',
  'Writing your contextual itinerary...'
];

function showLoading(dest) {
  document.getElementById('loading-dest').textContent = dest;
  document.getElementById('loading-overlay').style.display = 'flex';
  document.getElementById('generate-btn').disabled = true;

  const steps = document.querySelectorAll('.ls');
  steps.forEach(s => s.classList.remove('active'));
  steps[0].classList.add('active');

  let i = 0;
  window._loadingInterval = setInterval(() => {
    steps[i]?.classList.remove('active');
    i = Math.min(i + 1, steps.length - 1);
    steps[i]?.classList.add('active');
  }, 1800);
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
  document.getElementById('generate-btn').disabled = false;
  clearInterval(window._loadingInterval);
}

function showError(message) {
  const btn = document.getElementById('generate-btn');
  const orig = btn.innerHTML;
  btn.innerHTML = `<i class="ti ti-alert-circle"></i> ${message}`;
  btn.style.background = '#C85A1A';
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.background = '';
  }, 3000);
}

// ─── Auth integration ─────────────────────────────────────────────────
// Init auth on page load — updates nav with user avatar if logged in
(async () => {
  const user = await TF_AUTH.init();
  TF_AUTH.updateNavUser(user);

  // After Google OAuth redirect, restore any pending generation
  if (user && sessionStorage.getItem('tf_pending_generate')) {
    const pending = JSON.parse(sessionStorage.getItem('tf_pending_generate'));
    sessionStorage.removeItem('tf_pending_generate');
    if (pending.destination) {
      document.getElementById('dest-input').value = pending.destination;
      openFormExpansion(pending.destination);
      if (pending.days) document.getElementById('f-days').value = pending.days;
      if (pending.budgetCategory) document.getElementById('f-budget').value = pending.budgetCategory;
      if (pending.pace) document.getElementById('f-pace').value = pending.pace;
      if (pending.groupType) document.getElementById('f-group').value = pending.groupType;
    }
  }
})();

// Override generateItinerary to require auth first
const _originalGenerate = generateItinerary;
window.generateItinerary = async function() {
  const user = TF_AUTH.getUser();
  if (!user) {
    // Save current form state before redirecting to Google
    const destination = document.getElementById('dest-input').value.trim();
    if (destination) {
      sessionStorage.setItem('tf_pending_generate', JSON.stringify({
        destination,
        days: document.getElementById('f-days').value,
        budgetCategory: document.getElementById('f-budget').value,
        pace: document.getElementById('f-pace').value,
        groupType: document.getElementById('f-group').value
      }));
    }
    TF_AUTH.showLoginModal(async (loggedInUser) => {
      TF_AUTH.updateNavUser(loggedInUser);
      TF_AUTH.closeLoginModal();
      await _originalGenerate();
    });
    return;
  }
  await _originalGenerate();
};

// Override handleSearch to require auth
const _originalHandleSearch = handleSearch;
window.handleSearch = function(e) {
  if (e) e.preventDefault();
  const dest = document.getElementById('dest-input').value.trim();
  if (!dest) { document.getElementById('dest-input').focus(); return; }
  openFormExpansion(dest);
};
