/* main.js — Entry point, imports all modules */
import { initNav } from './nav.js';
import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { initForms } from './forms.js';
import { initPageContent } from './portfolio.js';
import { initAnimations } from './animations.js';
import { initMagneticCarousel, initCoverflow } from './carousels.js';
import { initHeroShowcase } from './hero-showcase.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initAuth();
  initChat();
  initForms();
  initPageContent();
  initAnimations();
  initMagneticCarousel();
  initCoverflow();
  initHeroShowcase();

  // Track page visit for analytics
  trackVisit();
});

async function trackVisit() {
  try {
    await fetch('/admin/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer || null }),
      credentials: 'include',
    });
  } catch {}
}
