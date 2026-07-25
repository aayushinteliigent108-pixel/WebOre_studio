/* animations.js — Advanced scroll reveals with IntersectionObserver (Animated theme) */
export function initAnimations() {
  // Main scroll reveal observer — handles .sr, .reveal-up, .reveal-left, .reveal-right, .reveal-scale, .card-slide
  const revealElements = document.querySelectorAll('.sr, .reveal-up, .reveal-left, .reveal-right, .reveal-scale, .card-slide');

  if (revealElements.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    });
    revealElements.forEach(el => revealObserver.observe(el));
  }

  // New reveal system — .reveal and .reveal-stagger
  const revealNew = document.querySelectorAll('.reveal, .reveal-stagger');
  if (revealNew.length) {
    const revealNewObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealNewObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    });
    revealNew.forEach(el => revealNewObserver.observe(el));
  }

  // Parallax background on sections — single RAF-throttled listener
  const parallaxBgs = document.querySelectorAll('.parallax-bg');
  if (parallaxBgs.length) {
    let parallaxRaf = false;
    function updateParallax() {
      for (let i = 0; i < parallaxBgs.length; i++) {
        const bg = parallaxBgs[i];
        const section = bg.parentElement;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) continue;
        const scrolled = rect.top / window.innerHeight;
        bg.style.transform = `translateY(${scrolled * 60}px)`;
      }
    }
    window.addEventListener('scroll', function () {
      if (parallaxRaf) return;
      parallaxRaf = true;
      requestAnimationFrame(function () {
        parallaxRaf = false;
        updateParallax();
      });
    }, { passive: true });
  }

  // Counter animation for stats
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObserver.observe(el));
  }

  // Stagger children in grids
  const staggerGrids = document.querySelectorAll('[data-stagger]');
  if (staggerGrids.length) {
    const gridObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          Array.from(children).forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.1}s`;
            child.classList.add('revealed');
          });
          gridObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    staggerGrids.forEach(el => gridObserver.observe(el));
  }

  // Horizontal scroll for testimonials
  initHorizontalScroll();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Cursor ambient glow (desktop only)
  initCursorGlow();

  // Magnetic hover on CTA buttons
  initMagneticButtons();
}

function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  // Skip on touch devices and reduced motion
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.classList.add('active');
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    glow.classList.remove('active');
  });
}

function initMagneticButtons() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const buttons = document.querySelectorAll('.btn--primary, .btn--lg');
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initHorizontalScroll() {
  const track = document.querySelector('.testimonials-track');
  if (!track) return;

  let isDown = false, startX, scrollLeft;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = ''; });
  track.addEventListener('mouseup', () => { isDown = false; track.style.cursor = ''; });
  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
}
