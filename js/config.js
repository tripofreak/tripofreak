// Tripofreak frontend config
// Change API_URL to your Hostinger backend URL before deploying

const CONFIG = {
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3002'
    : 'https://api.tripofreak.com', // Point this to your Hostinger backend

  UNSPLASH_FALLBACK: 'https://source.unsplash.com/800x500',

  // Razorpay public key (safe to expose in frontend)
  RAZORPAY_KEY_ID: 'rzp_live_YOUR_KEY_HERE', // Replace with your Razorpay key

  // Stripe public key (safe to expose in frontend)
  STRIPE_PUBLIC_KEY: 'pk_live_YOUR_KEY_HERE' // Replace with your Stripe key
};

// Freeze so it can't be accidentally mutated
Object.freeze(CONFIG);
