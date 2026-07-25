/* portfolio.js — Dynamic content with alternating scroll animations */
export function initPageContent() {
  loadServices();
  loadFeaturedPortfolio();
  loadProcess();
  loadPricing();
  loadTestimonials();
}

// Skeleton helpers
function skeletonCards(count, type = 'card') {
  const templates = {
    card: () => `<div class="card skeleton--card"><div class="skeleton skeleton--image" style="margin-bottom:var(--space-md);"></div><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>`,
    pricing: () => `<div class="pricing-card skeleton--card"><div class="skeleton skeleton--title" style="margin:0 auto var(--space-md);"></div><div class="skeleton skeleton--text" style="margin:0 auto var(--space-md);width:40%;"></div><div class="skeleton skeleton--text" style="margin-bottom:var(--space-sm);"></div><div class="skeleton skeleton--text" style="margin-bottom:var(--space-sm);"></div><div class="skeleton skeleton--text" style="margin-bottom:var(--space-sm);"></div></div>`,
    testimonial: () => `<div class="testimonial-card skeleton--card" style="min-width:380px;"><div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-md);"><div class="skeleton skeleton--avatar"></div><div><div class="skeleton skeleton--title" style="width:120px;"></div><div class="skeleton skeleton--text" style="width:80px;"></div></div></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text" style="width:60%;"></div></div>`,
  };
  return Array(count).fill(null).map(() => templates[type]()).join('');
}

function loadServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  const services = [
    { icon: '🎨', title: 'Web Design', text: 'Stunning, conversion-focused designs that make your brand impossible to ignore. We create visual identities that tell your story.', color: '#e8b923' },
    { icon: '⚡', title: 'Development', text: 'Fast, clean code using modern technologies. No bloated frameworks — just raw performance and reliability.', color: '#f2c94c' },
    { icon: '🛒', title: 'E-commerce', text: 'Online stores that sell. Secure payments, inventory management, and beautiful product pages that convert.', color: '#e8b923' },
    { icon: '📈', title: 'SEO', text: 'Get found on Google. Technical SEO, content strategy, and ongoing optimization to drive organic traffic.', color: '#f2c94c' },
    { icon: '🔧', title: 'Maintenance', text: 'Keep your site running perfectly. Updates, backups, security patches, and 24/7 monitoring.', color: '#e8b923' },
    { icon: '✨', title: 'Branding', text: 'Complete brand identity — logo, colors, typography, and guidelines that scale with your business.', color: '#f2c94c' },
  ];

  // Alternating left/right pattern
  const directions = ['card-slide--from-left', 'card-slide--from-right'];

  grid.innerHTML = services.map((s, i) => `
    <div class="service-card card-slide ${directions[i % 2]} sr-d${(i % 3) + 1}">
      <div class="service-card__icon" style="background:${s.color}15;color:${s.color};">${s.icon}</div>
      <h3 class="service-card__title">${s.title}</h3>
      <p class="service-card__text">${s.text}</p>
    </div>
  `).join('');
}

function loadFeaturedPortfolio() {
  // Homepage: populate coverflow
  const coverflowTrack = document.getElementById('coverflowTrack');
  // Portfolio page: populate grid
  const grid = document.getElementById('portfolioGrid');

  if (coverflowTrack) {
    loadCoverflow(coverflowTrack);
  }
  if (grid) {
    loadPortfolioGrid(grid);
  }
}

function loadCoverflow(track) {
  track.innerHTML = '<div style="text-align:center;color:var(--color-text-muted);padding:var(--space-2xl);">Loading projects...</div>';

  fetch('/api/portfolio/featured')
    .then(res => res.json())
    .then(data => {
      const projects = data.projects || [];
      if (projects.length === 0) {
        track.innerHTML = getDefaultCoverflowCards();
        return;
      }
      track.innerHTML = projects.map((p, i) => {
        const images = [
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=500&fit=crop',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=500&fit=crop',
          'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=400&h=500&fit=crop',
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=500&fit=crop',
          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=500&fit=crop',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=500&fit=crop',
        ];
        return `
          <div class="coverflow__card" style="background-image:url('${images[i % images.length]}');background-size:cover;background-position:center;">
            <div class="coverflow__card-overlay"></div>
            <div class="coverflow__card-info">
              <div class="coverflow__card-category">${escapeHtml(p.category)}</div>
              <div class="coverflow__card-title">${escapeHtml(p.title)}</div>
            </div>
          </div>
        `;
      }).join('');
    })
    .catch(() => {
      track.innerHTML = getDefaultCoverflowCards();
    });
}

function getDefaultCoverflowCards() {
  const projects = [
    { title: 'TechFlow Dashboard', category: 'Web Design', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=500&fit=crop' },
    { title: 'UrbanBrand Store', category: 'E-commerce', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=500&fit=crop' },
    { title: 'GreenLeaf Platform', category: 'Web Development', image: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=400&h=500&fit=crop' },
  ];
  return projects.map(p => `
    <div class="coverflow__card" style="background-image:url('${p.image}');background-size:cover;background-position:center;">
      <div class="coverflow__card-overlay"></div>
      <div class="coverflow__card-info">
        <div class="coverflow__card-category">${p.category}</div>
        <div class="coverflow__card-title">${p.title}</div>
      </div>
    </div>
  `).join('');
}

function loadPortfolioGrid(grid) {
  grid.innerHTML = skeletonCards(3, 'card');

  fetch('/api/portfolio/featured')
    .then(res => res.json())
    .then(data => {
      const projects = data.projects || [];
      grid.innerHTML = projects.length ? projects.map((p, i) => `
        <div class="portfolio-card card-slide ${i % 2 === 0 ? 'card-slide--from-left' : 'card-slide--from-right'} sr-d${(i % 3) + 1}">
          <div class="portfolio-card__image">
            ${p.imageUrl
              ? `<img src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.title)}" loading="lazy">`
              : getPlaceholderImage(p.category, i)
            }
          </div>
          <div class="portfolio-card__body">
            <div class="portfolio-card__category">${escapeHtml(p.category)}</div>
            <h3 class="portfolio-card__title">${escapeHtml(p.title)}</h3>
            <p class="portfolio-card__text">${escapeHtml(p.description)}</p>
            <a href="/portfolio" class="btn btn--ghost btn--sm" style="margin-top:var(--space-md);padding-left:0;">View Project →</a>
          </div>
        </div>
      `).join('') : '<div style="text-align:center;padding:var(--space-3xl);color:var(--color-text-muted);grid-column:1/-1;"><p style="font-size:var(--text-lg);margin-bottom:var(--space-sm);">No projects yet</p><p>Check back soon — we\'re always working on something new.</p></div>';
    })
    .catch(() => { grid.innerHTML = getDefaultPortfolio(); });
}

function getDefaultPortfolio() {
  const projects = [
    { category: 'Web Design', title: 'TechFlow Dashboard', text: 'A modern SaaS dashboard with real-time analytics and dark mode.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop' },
    { category: 'E-commerce', title: 'UrbanBrand Store', text: 'Full-featured e-commerce platform with custom product pages.', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop' },
    { category: 'Web Development', title: 'GreenLeaf Platform', text: 'Sustainable living platform with community features.', image: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=600&h=400&fit=crop' },
  ];
  return projects.map((p, i) => `
    <div class="portfolio-card card-slide ${i % 2 === 0 ? 'card-slide--from-left' : 'card-slide--from-right'} sr-d${i + 1}">
      <div class="portfolio-card__image" style="background-image:url('${p.image}');background-size:cover;background-position:center;height:240px;"></div>
      <div class="portfolio-card__body">
        <div class="portfolio-card__category">${p.category}</div>
        <h3 class="portfolio-card__title">${p.title}</h3>
        <p class="portfolio-card__text">${p.text}</p>
      </div>
    </div>
  `).join('');
}

function getPlaceholderImage(category, index) {
  const images = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
  ];
  const img = images[index % images.length];
  return `<div style="width:100%;height:100%;background-image:url('${img}');background-size:cover;background-position:center;"></div>`;
}

function loadProcess() {
  const timeline = document.getElementById('processTimeline');
  if (!timeline) return;

  const steps = [
    { num: '01', title: 'Discovery', text: 'We learn about your brand, goals, and audience. Strategy first, design second.', icon: '🔍' },
    { num: '02', title: 'Design', text: 'Custom visuals, wireframes, and prototypes — no templates, ever.', icon: '✏️' },
    { num: '03', title: 'Development', text: 'Clean, fast code built with modern technologies and best practices.', icon: '💻' },
    { num: '04', title: 'Launch', text: 'Testing, optimization, and a smooth launch — then ongoing support.', icon: '🚀' },
  ];

  const directions = ['card-slide--from-left', 'card-slide--from-bottom', 'card-slide--from-right', 'card-slide--from-bottom'];

  timeline.innerHTML = steps.map((s, i) => `
    <div class="process-step card-slide ${directions[i]} sr-d${i + 1}">
      <div class="process-step__number" style="position:relative;">
        <span style="font-size:1.5rem;">${s.icon}</span>
      </div>
      <h3 class="process-step__title">${s.title}</h3>
      <p class="process-step__text">${s.text}</p>
    </div>
  `).join('');
}

function loadPricing() {
  const grid = document.getElementById('pricingGrid');
  if (!grid) return;

  grid.innerHTML = skeletonCards(3, 'pricing');

  fetch('/api/pricing')
    .then(res => res.json())
    .then(data => {
      const plans = data.plans || [];
      if (!plans.length) { grid.innerHTML = getDefaultPricing(); return; }
      grid.innerHTML = plans.map((p, i) => {
        const features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
        return `
        <div class="pricing-card ${p.highlighted ? 'pricing-card--highlighted' : ''} card-slide ${i === 1 ? 'card-slide--from-bottom' : (i === 0 ? 'card-slide--from-left' : 'card-slide--from-right')} sr-d${i + 1}">
          ${p.highlighted ? '<div class="pricing-card__popular">Most Popular</div>' : ''}
          <div class="pricing-card__name">${escapeHtml(p.name)}</div>
          <div class="pricing-card__price">${escapeHtml(p.price)}</div>
          <div class="pricing-card__period">per ${escapeHtml(p.period || 'project')}</div>
          <div class="pricing-card__features">
            ${features.map(f => `
              <div class="pricing-card__feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${escapeHtml(f)}
              </div>
            `).join('')}
          </div>
          <a href="/contact" class="btn ${p.highlighted ? 'btn--primary' : 'btn--secondary'}" style="width:100%;justify-content:center;">Get Started</a>
        </div>`;
      }).join('');
    })
    .catch(() => { grid.innerHTML = getDefaultPricing(); });
}

function getDefaultPricing() {
  return `
    <div class="pricing-card card-slide card-slide--from-left sr-d1">
      <div class="pricing-card__name">Web Design</div>
      <div class="pricing-card__price">Custom</div>
      <div class="pricing-card__period">tailored to your project</div>
      <div class="pricing-card__features">
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Custom UI/UX design</div>
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Responsive across all devices</div>
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Brand-aligned visuals</div>
      </div>
      <a href="/contact" class="btn btn--secondary" style="width:100%;justify-content:center;">Get a Quote</a>
    </div>
    <div class="pricing-card pricing-card--highlighted card-slide card-slide--from-bottom sr-d2">
      <div class="pricing-card__popular">Most Popular</div>
      <div class="pricing-card__name">Full Stack</div>
      <div class="pricing-card__price">Custom</div>
      <div class="pricing-card__period">tailored to your project</div>
      <div class="pricing-card__features">
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Design + Development bundle</div>
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> CMS &amp; admin dashboard</div>
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> SEO &amp; performance optimized</div>
      </div>
      <a href="/contact" class="btn btn--primary" style="width:100%;justify-content:center;">Get a Quote</a>
    </div>
    <div class="pricing-card card-slide card-slide--from-right sr-d3">
      <div class="pricing-card__name">E-commerce</div>
      <div class="pricing-card__price">Custom</div>
      <div class="pricing-card__period">tailored to your project</div>
      <div class="pricing-card__features">
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Full online store setup</div>
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Secure payment integration</div>
        <div class="pricing-card__feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> 90-day maintenance included</div>
      </div>
      <a href="/contact" class="btn btn--secondary" style="width:100%;justify-content:center;">Get a Quote</a>
    </div>`;
}

function loadTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;

  track.innerHTML = skeletonCards(3, 'testimonial');

  fetch('/api/testimonials')
    .then(res => res.json())
    .then(data => {
      const testimonials = data.testimonials || [];
      track.innerHTML = testimonials.length ? testimonials.map(t => testimonialCard(t.name, t.role, t.company, t.quote, t.rating)) : getDefaultTestimonials();
    })
    .catch(() => { track.innerHTML = getDefaultTestimonials(); });
}

function testimonialCard(name, role, company, quote, rating) {
  return `
    <div class="testimonial-card sr sr--up">
      <div class="testimonial-card__header">
        <div class="avatar" style="background:linear-gradient(135deg,var(--color-accent),#FFE066);color:var(--color-bg-primary);">${name?.charAt(0) || '?'}</div>
        <div>
          <div class="testimonial-card__name">${escapeHtml(name)}</div>
          <div class="testimonial-card__role">${escapeHtml(role)} at ${escapeHtml(company)}</div>
        </div>
      </div>
      <div class="testimonial-card__stars">
        ${'<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'.repeat(rating || 5)}
      </div>
      <p class="testimonial-card__quote">"${escapeHtml(quote)}"</p>
    </div>`;
}

function getDefaultTestimonials() {
  const data = [
    { name: 'Webore Portfolio', role: 'Our Work', company: 'Webore', quote: 'Every project we deliver is crafted with precision, care, and a commitment to excellence that shows in the results.', rating: 5 },
    { name: 'Webore Process', role: 'How We Work', company: 'Webore', quote: 'From discovery to launch, our process ensures every project is delivered on time, within budget, and beyond expectations.', rating: 5 },
    { name: 'Webore Quality', role: 'Our Standards', company: 'Webore', quote: 'We don\'t cut corners. Every pixel, every line of code, every interaction is designed to deliver real business results.', rating: 5 },
  ];
  return data.map(t => testimonialCard(t.name, t.role, t.company, t.quote, t.rating)).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
