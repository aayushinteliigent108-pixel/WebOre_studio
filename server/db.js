// server/db.js — Database initialization and Prisma client
import { PrismaClient } from '@prisma/client';

let prisma;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function initDatabase() {
  const db = getPrisma();
  await db.$connect();
  console.log('Database connected.');

  // Seed default chatbot config with realistic business data
  const defaultConfig = {
    services: JSON.stringify([
      { name: 'Web Design', description: 'Custom, premium website design tailored to your brand. We create visually stunning, conversion-focused designs that make your brand impossible to ignore. No templates — every pixel is intentional.' },
      { name: 'Web Development', description: 'Fast, clean code using modern technologies like React, Next.js, Node.js, and vanilla JS. No bloated frameworks — just raw performance and reliability that your users will feel.' },
      { name: 'E-commerce', description: 'Online stores that actually sell. Secure payments via Stripe/PayPal, inventory management, beautiful product pages, abandoned cart recovery, and analytics to track your revenue.' },
      { name: 'SEO', description: 'Get found on Google. Technical SEO audits, keyword research, on-page optimization, content strategy, and monthly reporting. We drive organic traffic that actually converts.' },
      { name: 'Maintenance', description: 'Keep your site running perfectly after launch. Weekly backups, security patches, 24/7 uptime monitoring, performance optimization, and priority support.' },
      { name: 'Branding', description: 'Complete brand identity — logo design, color palette, typography, brand guidelines, stationery, and social media kit. We create brands that people remember and trust.' },
    ]),
    pricing: JSON.stringify([
      { name: 'Starter', price: '₹999', features: ['5-page responsive website', 'Basic SEO setup', 'Mobile-first design', '1 revision round', '7-day delivery'], highlighted: false },
      { name: 'Business', price: '₹2,499', features: ['10-page responsive website', 'Advanced SEO & analytics', 'CMS integration', 'E-commerce ready', '3 revision rounds', '30-day support'], highlighted: true },
      { name: 'Enterprise', price: '₹4,999', features: ['Unlimited pages', 'Custom features & integrations', 'Priority support', '90-day maintenance', 'Dedicated project manager', 'Unlimited revisions'], highlighted: false },
    ]),
    faqs: JSON.stringify([
      { q: 'How long does a project take?', a: 'Typically 2-6 weeks depending on the tier and scope. Starter projects wrap in about 2 weeks, Business in 3-4 weeks, and Enterprise can take 4-6 weeks for full-scale builds. We always give you a timeline upfront.' },
      { q: 'What do you need from me to get started?', a: 'Just a rough idea of what you want! We handle the rest. If you have branding assets, a logo, or content — great. If not, we can help with that too. Our Discovery call covers everything.' },
      { q: 'How many revisions are included?', a: 'Starter includes 1 revision round, Business includes 3, and Enterprise gets unlimited. A "round" means one round of consolidated feedback — we encourage batching your changes together for efficiency.' },
      { q: 'What happens after I pay?', a: 'After payment, we kick off with a Discovery call within 24 hours. You\'ll get a project timeline, a dedicated point of contact, and regular progress updates throughout the build.' },
      { q: 'Can I upgrade my plan later?', a: 'Absolutely. You can upgrade at any time and we\'ll apply the difference toward your new tier. Many clients start with Starter and move to Business once they see results.' },
      { q: 'Do you offer payment plans?', a: 'Yes — we offer a 50/50 split: 50% upfront to begin, 50% upon delivery. For Enterprise projects, we can arrange milestone-based payments. Just ask during your consultation.' },
      { q: 'Do you handle maintenance after launch?', a: 'Yes! We offer ongoing maintenance plans that include weekly backups, security patches, uptime monitoring, and performance optimization. You can add this to any tier.' },
      { q: 'What if I\'m not happy with the design?', a: 'We iterate until you love it. Our process includes revision rounds specifically for this. Plus, our Discovery phase ensures we\'re aligned before any design work begins.' },
      { q: 'Do you work with clients globally?', a: 'Absolutely — we\'re a remote-first studio. We\'ve worked with clients across the US, Europe, and Asia. Time zones are never an issue with our async communication approach.' },
      { q: 'What technologies do you use?', a: 'We pick the right stack for each project: React, Next.js, Node.js, vanilla JS, PostgreSQL, MongoDB, Tailwind CSS, and more. We\'re framework-agnostic — we use what works best for your needs.' },
    ]),
    working_hours: JSON.stringify({ weekdays: '9:00 AM - 6:00 PM (EST)', weekends: 'Closed', response_time: 'Within 24 hours' }),
    company_info: JSON.stringify({
      name: 'Webore',
      email: 'webore1007@gmail.com',
      phone: '+1 (555) 123-4567',
      location: 'Remote / Global',
      tagline: 'Premium creative digital studio',
    }),
  };

  for (const [key, value] of Object.entries(defaultConfig)) {
    await db.chatbotConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Seed default pricing plans
  const pricingPlans = [
    { name: 'Starter', price: '₹999', period: 'project', description: 'Perfect for small businesses and startups', features: JSON.stringify(['5-page responsive website', 'Basic SEO setup', 'Mobile-first design', '1 revision round', '7-day delivery']), highlighted: false, order: 0 },
    { name: 'Business', price: '₹2,499', period: 'project', description: 'For growing businesses that need more', features: JSON.stringify(['10-page responsive website', 'Advanced SEO & analytics', 'CMS integration', 'E-commerce ready', '3 revision rounds', '30-day support']), highlighted: true, order: 1 },
    { name: 'Enterprise', price: '₹4,999', period: 'project', description: 'Full-scale custom solutions', features: JSON.stringify(['Unlimited pages', 'Custom features & integrations', 'Priority support', '90-day maintenance', 'Dedicated project manager', 'Unlimited revisions']), highlighted: false, order: 2 },
  ];

  for (const plan of pricingPlans) {
    const existing = await db.pricingPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await db.pricingPlan.create({ data: plan });
    }
  }

  // Seed default testimonials — using real project references instead of fake names
  const testimonials = [
    { name: 'Webore Portfolio', role: 'Our Work', company: 'Webore', quote: 'Every project we deliver is crafted with precision, care, and a commitment to excellence that shows in the results.', rating: 5, imageSource: 'web', attribution: 'Webore' },
    { name: 'Webore Process', role: 'How We Work', company: 'Webore', quote: 'From discovery to launch, our process ensures every project is delivered on time, within budget, and beyond expectations.', rating: 5, imageSource: 'web', attribution: 'Webore' },
    { name: 'Webore Quality', role: 'Our Standards', company: 'Webore', quote: 'We don\'t cut corners. Every pixel, every line of code, every interaction is designed to deliver real business results.', rating: 5, imageSource: 'web', attribution: 'Webore' },
  ];

  for (const t of testimonials) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) {
      await db.testimonial.create({ data: t });
    }
  }

  // Seed default portfolio projects
  const projects = [
    { title: 'TechFlow Dashboard', slug: 'techflow-dashboard', category: 'Web Design', description: 'A modern SaaS dashboard with real-time analytics and dark mode.', imageSource: 'web', featured: true, order: 0 },
    { title: 'UrbanBrand Store', slug: 'urbanbrand-store', category: 'E-commerce', description: 'Full-featured e-commerce platform with custom product pages.', imageSource: 'web', featured: true, order: 1 },
    { title: 'GreenLeaf Platform', slug: 'greenleaf-platform', category: 'Web Development', description: 'Sustainable living platform with community features.', imageSource: 'web', featured: true, order: 2 },
    { title: 'NovaFinance App', slug: 'novafinance-app', category: 'Web Design', description: 'Fintech web app with clean data visualization.', imageSource: 'web', featured: false, order: 3 },
    { title: 'Artistry Studio', slug: 'artistry-studio', category: 'Branding', description: 'Complete brand identity and website for an art studio.', imageSource: 'web', featured: false, order: 4 },
    { title: 'FitPulse Gym', slug: 'fitpulse-gym', category: 'E-commerce', description: 'Membership platform with class booking and payment.', imageSource: 'web', featured: false, order: 5 },
  ];

  for (const p of projects) {
    const existing = await db.portfolioProject.findFirst({ where: { slug: p.slug } });
    if (!existing) {
      await db.portfolioProject.create({ data: p });
    }
  }

  console.log('Database seeded.');
}
