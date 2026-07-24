/* carousels.js — Magnetic carousel + Coverflow gallery (vanilla JS) */

const SERVICES = [
  { icon: '🎨', title: 'Web Design', desc: 'Stunning, conversion-focused designs that make your brand impossible to ignore.', features: ['Custom UI/UX design', 'Responsive across all devices', 'Interactive prototypes', 'Conversion-optimized layouts', 'Brand-aligned visual identity'] },
  { icon: '⚡', title: 'Development', desc: 'Fast, clean code using modern technologies.', features: ['React, Next.js, Node.js', 'REST APIs & GraphQL', 'Database optimization', '99.9% uptime guaranteed', 'CI/CD deployments'] },
  { icon: '🛒', title: 'E-commerce', desc: 'Online stores that actually sell.', features: ['Stripe, PayPal integration', 'Inventory management', 'Product pages that convert', 'Abandoned cart recovery', 'Sales analytics'] },
  { icon: '📈', title: 'SEO', desc: 'Get found on Google.', features: ['Technical SEO audit', 'Keyword strategy', 'On-page optimization', 'Monthly reporting', 'Local SEO'] },
  { icon: '🔧', title: 'Maintenance', desc: 'Keep your site running perfectly.', features: ['24/7 monitoring', 'Weekly backups', 'Security patches', 'Performance optimization', 'Priority support'] },
  { icon: '✨', title: 'Branding', desc: 'Complete brand identity.', features: ['Logo design', 'Color palette', 'Brand guidelines', 'Stationery design', 'Social media kit'] },
];

// ===== MAGNETIC CAROUSEL =====
export function initMagneticCarousel() {
  const container = document.querySelector('.magnetic-carousel');
  if (!container) return;
  const items = container.querySelectorAll('.magnetic-carousel__item');
  if (items.length === 0) return;

  const isMobile = window.innerWidth <= 768;
  const cw = isMobile ? 90 : 130;
  const hw = isMobile ? 140 : 220;
  const ch = isMobile ? 280 : 380;
  const hh = isMobile ? 320 : 420;
  const influence = 220;

  let targets = new Array(items.length).fill(0);
  let current = new Array(items.length).fill(0);
  let raf = null;

  function animate() {
    let moving = false;
    for (let i = 0; i < current.length; i++) {
      const d = targets[i] - current[i];
      if (Math.abs(d) > 0.001) { current[i] += d * 0.18; moving = true; }
      else { current[i] = targets[i]; }
      items[i].style.width = cw + (hw - cw) * current[i] + 'px';
      items[i].style.height = ch + (hh - ch) * current[i] + 'px';
    }
    raf = moving ? requestAnimationFrame(animate) : null;
  }

  function start() { if (!raf) raf = requestAnimationFrame(animate); }

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    items.forEach((item, i) => {
      const ic = item.getBoundingClientRect().left + item.getBoundingClientRect().width / 2 - rect.left;
      const f = Math.max(0, 1 - Math.abs(cx - ic) / influence);
      targets[i] = f * f * (3 - 2 * f);
    });
    start();
  });

  container.addEventListener('mouseleave', () => {
    targets = new Array(items.length).fill(0);
    start();
  });

  container.addEventListener('touchmove', (e) => {
    const cx = e.touches[0].clientX - container.getBoundingClientRect().left;
    items.forEach((item, i) => {
      const ic = item.getBoundingClientRect().left + item.getBoundingClientRect().width / 2 - container.getBoundingClientRect().left;
      const f = Math.max(0, 1 - Math.abs(cx - ic) / influence);
      targets[i] = f * f * (3 - 2 * f);
    });
    start();
  }, { passive: true });

  container.addEventListener('touchend', () => {
    targets = new Array(items.length).fill(0);
    start();
  });

  items.forEach((item, i) => {
    item.addEventListener('click', () => openServicePopup(i));
  });
}

function openServicePopup(index) {
  const service = SERVICES[index];
  if (!service) return;
  let popup = document.getElementById('servicePopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'servicePopup';
    popup.className = 'service-popup';
    popup.setAttribute('role', 'dialog');
    popup.innerHTML = `
      <div class="service-popup__backdrop" data-close-popup></div>
      <div class="service-popup__card">
        <button class="service-popup__close" data-close-popup aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>
        </button>
        <div class="service-popup__icon"></div>
        <h3 class="service-popup__title"></h3>
        <p class="service-popup__desc"></p>
        <div class="service-popup__features"></div>
        <a href="/contact" class="btn btn--primary" style="width:100%;justify-content:center;">Get Started →</a>
      </div>`;
    document.body.appendChild(popup);
    popup.querySelectorAll('[data-close-popup]').forEach(el => el.addEventListener('click', closeServicePopup));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeServicePopup(); });
  }
  popup.querySelector('.service-popup__icon').textContent = service.icon;
  popup.querySelector('.service-popup__title').textContent = service.title;
  popup.querySelector('.service-popup__desc').textContent = service.desc;
  popup.querySelector('.service-popup__features').innerHTML = service.features.map(f =>
    `<div class="service-popup__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>${f}</div>`
  ).join('');
  popup.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeServicePopup() {
  const popup = document.getElementById('servicePopup');
  if (popup) { popup.classList.remove('active'); document.body.style.overflow = ''; }
}

// ===== COVERFLOW GALLERY (Simple 3-card visible) =====
export function initCoverflow() {
  const container = document.querySelector('.coverflow');
  if (!container) return;

  const track = container.querySelector('.coverflow__track');
  const prevBtn = container.querySelector('.coverflow__prev');
  const nextBtn = container.querySelector('.coverflow__next');
  const dotsContainer = document.getElementById('coverflowDots');

  if (!track) return;

  // Wait for cards to be rendered by portfolio.js
  const waitForCards = () => {
    const cards = track.querySelectorAll('.coverflow__card');
    if (cards.length === 0) {
      requestAnimationFrame(waitForCards);
      return;
    }
    setupCoverflow(cards);
  };

  function setupCoverflow(cards) {
    const n = cards.length;
    let active = 0;

    // Create dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const dot = document.createElement('button');
        dot.className = 'coverflow__dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }

    function goTo(index) {
      active = ((index % n) + n) % n;
      render();
    }

    function render() {
      cards.forEach((card, i) => {
        let rel = i - active;
        if (rel > n / 2) rel -= n;
        if (rel < -n / 2) rel += n;

        const abs = Math.abs(rel);
        const isActive = rel === 0;

        // Position: center=0, left=-1 is left side, right=+1 is right side
        const offsetX = rel * 180; // spacing between cards
        const scale = isActive ? 1 : (abs === 1 ? 0.75 : 0.6);
        const rotateY = rel * -20; // tilt side cards
        const translateZ = isActive ? 50 : -abs * 100;
        const opacity = abs <= 2 ? 1 : 0;

        card.style.transform = `translateX(${offsetX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.zIndex = isActive ? 10 : 5 - abs;
        card.style.filter = isActive ? 'none' : 'brightness(0.5)';
        card.classList.toggle('active', isActive);

        card.onclick = () => goTo(i);
      });

      // Update dots
      const dots = dotsContainer?.querySelectorAll('.coverflow__dot');
      dots?.forEach((dot, i) => dot.classList.toggle('active', i === active));
    }

    prevBtn?.addEventListener('click', () => goTo(active - 1));
    nextBtn?.addEventListener('click', () => goTo(active + 1));

    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goTo(active + 1);
      if (e.key === 'ArrowLeft') goTo(active - 1);
    });

    render();
  }

  waitForCards();
}
