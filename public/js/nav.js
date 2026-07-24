/* nav.js — Navigation: hamburger menu, scroll state, overlay */
export function initNav() {
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');
  const menuClose = document.getElementById('menuClose');
  const overlay = document.getElementById('navOverlay');
  const overlayLinks = overlay?.querySelectorAll('.nav-overlay__link');

  if (!nav || !menuBtn || !overlay) return;

  // Scroll state
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    nav.classList.toggle('scrolled', currentScroll > 50);
    lastScroll = currentScroll;
  }, { passive: true });

  // Open menu
  menuBtn.addEventListener('click', () => {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    menuClose?.focus();
  });

  // Close menu
  function closeMenu() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuBtn.focus();
  }

  menuClose?.addEventListener('click', closeMenu);

  // Close on link click
  overlayLinks?.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeMenu();
    }
  });
}
