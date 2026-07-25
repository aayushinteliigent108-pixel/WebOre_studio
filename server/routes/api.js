// server/routes/api.js — Public API routes (portfolio, pricing, testimonials, contact)
import { Router } from 'express';
import { getPrisma } from '../db.js';
import fetch from 'node-fetch';
import { notifyAdminNewLead, notifyAdminNewProject, notifyClientProjectReceived } from '../mailer.js';


const router = Router();

// Portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const prisma = getPrisma();
    const projects = await prisma.portfolioProject.findMany({ orderBy: { order: 'asc' } });
    res.json({ projects });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.json({ projects: [] });
  }
});

router.get('/portfolio/featured', async (req, res) => {
  try {
    const prisma = getPrisma();
    const projects = await prisma.portfolioProject.findMany({ where: { featured: true }, orderBy: { order: 'asc' } });
    res.json({ projects });
  } catch (err) {
    console.error('Portfolio featured error:', err);
    res.json({ projects: [] });
  }
});

// Pricing
router.get('/pricing', async (req, res) => {
  try {
    const prisma = getPrisma();
    const plans = await prisma.pricingPlan.findMany({ orderBy: { order: 'asc' } });
    res.json({ plans: plans.map(p => ({ ...p, features: JSON.parse(p.features) })) });
  } catch (err) {
    console.error('Pricing error:', err);
    res.json({ plans: [] });
  }
});

// Testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const prisma = getPrisma();
    const testimonials = await prisma.testimonial.findMany();
    res.json({ testimonials });
  } catch (err) {
    console.error('Testimonials error:', err);
    res.json({ testimonials: [] });
  }
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
    // Fire-and-forget email to admin's Gmail — never blocks/breaks the response
    notifyAdminNewLead({ name, email, phone, projectType, budget, message });
    res.json({ success: true, message: 'Thank you! We\'ll get back to you within 24 hours.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to submit message.' });
  }
});

// ==================== START A PROJECT (multi-step wizard) ====================
// Deliberately separate from /api/contact. Contact Us -> Message model
// (shows in admin "Contact Leads"). Start a Project -> ClientProject + first
// ClientMessage (shows in admin "Client Projects" / "Client Messages"), so the
// two flows never mix up in the admin panel.
router.post('/start-project', async (req, res) => {
  try {
    const {
      clientName, clientEmail, phone,
      projectType, budget, timeline,
      goals, features, hasExistingSite, existingSiteUrl,
      inspiration, notes,
    } = req.body;

    if (!clientName || !clientEmail || !projectType) {
      return res.status(400).json({ error: 'Name, email, and project type are required.' });
    }

    const prisma = getPrisma();
    const title = `${projectType} — ${clientName}`;

    const descriptionParts = [
      goals && `Goals: ${goals}`,
      features && `Key features: ${Array.isArray(features) ? features.join(', ') : features}`,
      hasExistingSite && `Existing site: ${existingSiteUrl || 'yes, but no URL given'}`,
      inspiration && `Inspiration / references: ${inspiration}`,
      timeline && `Desired timeline: ${timeline}`,
      notes && `Additional notes: ${notes}`,
    ].filter(Boolean).join('\n');

    const project = await prisma.clientProject.create({
      data: {
        title,
        clientName,
        clientEmail,
        status: 'received',
        priority: 'medium',
        description: descriptionParts || null,
        budget: budget || null,
      },
    });

    // Store the original submission as the first message thread on the project
    await prisma.clientMessage.create({
      data: {
        projectId: project.id,
        sender: 'client',
        senderName: clientName,
        senderEmail: clientEmail,
        content: descriptionParts || 'New project request submitted via the Start a Project wizard.',
        read: false,
      },
    });

    notifyAdminNewProject({ title, clientName, clientEmail, description: descriptionParts, projectType, budget, timeline });
    notifyClientProjectReceived({ clientEmail, clientName, title });

    res.json({ success: true, projectId: project.id, message: 'Thanks! Your project request is in — we\'ll be in touch within 24 hours.' });
  } catch (err) {
    console.error('Start project error:', err);
    res.status(500).json({ error: 'Failed to submit project request.' });
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
  try {
    const prisma = getPrisma();
    const messages = await prisma.message.findMany({
      where: { email: req.user.email },
      select: { id: true, name: true, projectType: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ updates: messages });
  } catch (err) {
    console.error('Client updates error:', err);
    res.json({ updates: [] });
  }
});

// ==================== CLIENT PROJECTS ====================
// Get all projects for the logged-in client
router.get('/client/projects', requireAuth, async (req, res) => {
  try {
    const prisma = getPrisma();
    const projects = await prisma.clientProject.findMany({
      where: { clientEmail: req.user.email },
      orderBy: { updatedAt: 'desc' },
      include: {
        updates: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    res.json({ projects });
  } catch (err) {
    console.error('Client projects error:', err);
    res.json({ projects: [] });
  }
});

// Get a single project for the client (must own it)
router.get('/client/projects/:id', requireAuth, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.clientProject.findUnique({
      where: { id: req.params.id },
      include: {
        updates: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.clientEmail !== req.user.email) return res.status(403).json({ error: 'Access denied.' });
    res.json({ project });
  } catch (err) {
    console.error('Client project error:', err);
    res.status(500).json({ error: 'Failed to load project.' });
  }
});

// Client sends a message on their project
router.post('/client/projects/:id/messages', requireAuth, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.clientProject.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.clientEmail !== req.user.email) return res.status(403).json({ error: 'Access denied.' });
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });
    const message = await prisma.clientMessage.create({
      data: {
        projectId: project.id,
        sender: 'client',
        senderName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
        senderEmail: req.user.email,
        content: content.trim(),
        read: false,
      },
    });
    res.json({ message });
  } catch (err) {
    console.error('Client message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
