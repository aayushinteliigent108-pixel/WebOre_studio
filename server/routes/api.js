// server/routes/api.js — Public API routes (portfolio, pricing, testimonials, contact)
import { Router } from 'express';
import { getPrisma } from '../db.js';
import fetch from 'node-fetch';

const router = Router();

// Portfolio
router.get('/portfolio', async (req, res) => {
  const prisma = getPrisma();
  const projects = await prisma.portfolioProject.findMany({ orderBy: { order: 'asc' } });
  res.json({ projects });
});

router.get('/portfolio/featured', async (req, res) => {
  const prisma = getPrisma();
  const projects = await prisma.portfolioProject.findMany({ where: { featured: true }, orderBy: { order: 'asc' } });
  res.json({ projects });
});

// Pricing
router.get('/pricing', async (req, res) => {
  const prisma = getPrisma();
  const plans = await prisma.pricingPlan.findMany({ orderBy: { order: 'asc' } });
  res.json({ plans: plans.map(p => ({ ...p, features: JSON.parse(p.features) })) });
});

// Testimonials
router.get('/testimonials', async (req, res) => {
  const prisma = getPrisma();
  const testimonials = await prisma.testimonial.findMany();
  res.json({ testimonials });
});

// Contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, projectType, budget, message } = req.body;
    if (!name || !email || !projectType || !message) {
      return res.status(400).json({ error: 'Name, email, project type, and message are required.' });
    }
    const prisma = getPrisma();
    await prisma.message.create({
      data: { name, email, phone: phone || null, projectType, budget: budget || null, message },
    });
    res.json({ success: true, message: 'Thank you! We\'ll get back to you within 24 hours.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to submit message.' });
  }
});

// Image search (auto-fetch from Unsplash/Pexels/Pixabay)
router.get('/images/search', async (req, res) => {
  try {
    const { query, page = 1, per_page = 9 } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required.' });

    const provider = process.env.IMAGE_PROVIDER || 'unsplash';
    const apiKey = process.env.IMAGE_API_KEY;

    if (!apiKey) {
      return res.json({ images: [], message: 'Image API not configured.' });
    }

    let images = [];

    if (provider === 'unsplash') {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`, {
        headers: { 'Authorization': `Client-ID ${apiKey}` },
      });
      const data = await response.json();
      images = (data.results || []).map(img => ({
        url: img.urls.regular,
        thumb: img.urls.thumb,
        alt: img.alt_description || query,
        attribution: `Photo by ${img.user.name} on Unsplash`,
        source: 'unsplash',
      }));
    } else if (provider === 'pexels') {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`, {
        headers: { 'Authorization': apiKey },
      });
      const data = await response.json();
      images = (data.photos || []).map(img => ({
        url: img.src.large,
        thumb: img.src.small,
        alt: img.alt || query,
        attribution: `Photo by ${img.photographer} on Pexels`,
        source: 'pexels',
      }));
    } else if (provider === 'pixabay') {
      const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`);
      const data = await response.json();
      images = (data.hits || []).map(img => ({
        url: img.largeImageURL,
        thumb: img.previewURL,
        alt: img.tags || query,
        attribution: `Image by ${img.user} on Pixabay`,
        source: 'pixabay',
      }));
    }

    res.json({ images });
  } catch (err) {
    console.error('Image search error:', err);
    res.json({ images: [], message: 'Failed to fetch images.' });
  }
});

// Newsletter subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const prisma = getPrisma();
    await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } });
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Subscription failed.' });
  }
});

// Client dashboard — get messages by user email (requires auth)
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'webore-jwt-secret';

function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

// Get client's own messages
router.get('/client/messages', requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const messages = await prisma.message.findMany({
    where: { email: req.user.email },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ messages });
});

// Get client's profile
router.get('/client/profile', requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, firstName: true, lastName: true, avatar: true, provider: true, createdAt: true },
  });
  res.json({ user });
});

// Get all status updates (team notes on messages)
router.get('/client/updates', requireAuth, async (req, res) => {
  const prisma = getPrisma();
  // Get messages with their notes (using the status field as a simple update system)
  const messages = await prisma.message.findMany({
    where: { email: req.user.email },
    select: { id: true, name: true, projectType: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ updates: messages });
});

export default router;
