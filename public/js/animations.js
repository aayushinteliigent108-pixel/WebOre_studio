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

  // Parallax background on sections
  const parallaxBgs = document.querySelectorAll('.parallax-bg');
  if (parallaxBgs.length) {
    const parallaxObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          window.addEventListener('scroll', updateParallax, { passive: true });
        } else {
          window.removeEventListener('scroll', updateParallax);
        }
      });
    }, { threshold: 0 });
    parallaxBgs.forEach(el => parallaxObserver.observe(el));

    function updateParallax() {
      parallaxBgs.forEach(bg => {
        const section = bg.parentElement;
        const rect = section.getBoundingClientRect();
        const scrolled = rect.top / window.innerHeight;
        bg.style.transform = `translateY(${scrolled * 60}px)`;
      });
    }
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
