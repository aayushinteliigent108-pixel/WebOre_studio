// server/routes/admin.js — Admin panel API routes
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { getPrisma } from '../db.js';
import fetch from 'node-fetch';
import { notifyClientNewMessage } from '../mailer.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET required in production'); })() : 'webore-jwt-secret');

// Rate limit setup-admin: max 3 attempts per hour (one-time bootstrap only)
const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many setup attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin auth middleware
function requireAdmin(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

// Dashboard stats
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const [leadCount, userCount, messageCount, loginLogCount] = await Promise.all([
      prisma.message.count(),
      prisma.user.count(),
      prisma.message.count({ where: { status: 'new' } }),
      prisma.loginLog.count({ where: { status: 'success' } }),
    ]);
    const recentLeads = await prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    const recentLogins = await prisma.loginLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    res.json({ leadCount, userCount, newLeads: messageCount, successfulLogins: loginLogCount, recentLeads, recentLogins });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// Messages
router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const messages = await prisma.message.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ messages });
  } catch (err) {
    console.error('Messages error:', err);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

router.patch('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const { status } = req.body;
    const message = await prisma.message.update({ where: { id: req.params.id }, data: { status } });
    res.json({ message });
  } catch (err) {
    console.error('Message update error:', err);
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

router.delete('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Message delete error:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// Users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, avatar: true, provider: true, role: true, createdAt: true } });
    res.json({ users });
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: { id: true, email: true, firstName: true, lastName: true, role: true } });
    res.json({ user });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Login logs
router.get('/login-logs', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const logs = await prisma.loginLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ logs });
  } catch (err) {
    console.error('Login logs error:', err);
    res.status(500).json({ error: 'Failed to load login logs.' });
  }
});

// Chat metrics
router.get('/chat-metrics', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const sessionCount = await prisma.chatSession.count();
    const messageCount = await prisma.chatMessage.count();
    res.json({ sessionCount, messageCount });
  } catch (err) {
    console.error('Chat metrics error:', err);
    res.status(500).json({ error: 'Failed to load chat metrics.' });
  }
});

// Chatbot config
router.get('/chatbot-config', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const configs = await prisma.chatbotConfig.findMany();
    const config = {};
    configs.forEach(c => { try { config[c.key] = JSON.parse(c.value); } catch { config[c.key] = null; } });
    res.json({ config });
  } catch (err) {
    console.error('Chatbot config error:', err);
    res.status(500).json({ error: 'Failed to load config.' });
  }
});

router.put('/chatbot-config', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.chatbotConfig.upsert({
        where: { key },
        update: { value: JSON.stringify(value), updatedAt: new Date() },
        create: { key, value: JSON.stringify(value) },
      });
    }
    res.json({ success: true, message: 'Config updated.' });
  } catch (err) {
    console.error('Chatbot config update error:', err);
    res.status(500).json({ error: 'Failed to update config.' });
  }
});

// Portfolio CRUD
router.get('/portfolio', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const projects = await prisma.portfolioProject.findMany({ orderBy: { order: 'asc' } });
    res.json({ projects });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ error: 'Failed to load portfolio.' });
  }
});

router.post('/portfolio', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.portfolioProject.create({ data: req.body });
    res.json({ project });
  } catch (err) {
    console.error('Portfolio create error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

router.put('/portfolio/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.portfolioProject.update({ where: { id: req.params.id }, data: req.body });
    res.json({ project });
  } catch (err) {
    console.error('Portfolio update error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

router.delete('/portfolio/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.portfolioProject.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Portfolio delete error:', err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// Pricing CRUD
router.get('/pricing', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const plans = await prisma.pricingPlan.findMany({ orderBy: { order: 'asc' } });
    res.json({ plans: plans.map(p => ({ ...p, features: JSON.parse(p.features) })) });
  } catch (err) {
    console.error('Pricing error:', err);
    res.status(500).json({ error: 'Failed to load pricing.' });
  }
});

router.post('/pricing', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const plan = await prisma.pricingPlan.create({ data: { ...req.body, features: JSON.stringify(req.body.features) } });
    res.json({ plan });
  } catch (err) {
    console.error('Pricing create error:', err);
    res.status(500).json({ error: 'Failed to create plan.' });
  }
});

router.put('/pricing/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const data = { ...req.body };
    if (data.features) data.features = JSON.stringify(data.features);
    const plan = await prisma.pricingPlan.update({ where: { id: req.params.id }, data });
    res.json({ plan });
  } catch (err) {
    console.error('Pricing update error:', err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

router.delete('/pricing/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.pricingPlan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Pricing delete error:', err);
    res.status(500).json({ error: 'Failed to delete plan.' });
  }
});

// Testimonials CRUD
router.get('/testimonials', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const testimonials = await prisma.testimonial.findMany();
    res.json({ testimonials });
  } catch (err) {
    console.error('Testimonials error:', err);
    res.status(500).json({ error: 'Failed to load testimonials.' });
  }
});

router.post('/testimonials', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const testimonial = await prisma.testimonial.create({ data: req.body });
    res.json({ testimonial });
  } catch (err) {
    console.error('Testimonial create error:', err);
    res.status(500).json({ error: 'Failed to create testimonial.' });
  }
});

router.put('/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const testimonial = await prisma.testimonial.update({ where: { id: req.params.id }, data: req.body });
    res.json({ testimonial });
  } catch (err) {
    console.error('Testimonial update error:', err);
    res.status(500).json({ error: 'Failed to update testimonial.' });
  }
});

router.delete('/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Testimonial delete error:', err);
    res.status(500).json({ error: 'Failed to delete testimonial.' });
  }
});

// Image search for admin
router.get('/images/search', requireAdmin, async (req, res) => {
  try {
    const { query, page = 1, per_page = 12 } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required.' });
    const provider = process.env.IMAGE_PROVIDER || 'unsplash';
    const apiKey = process.env.IMAGE_API_KEY;
    if (!apiKey) return res.json({ images: [], message: 'Image API not configured.' });

    let images = [];
    if (provider === 'unsplash') {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`, {
        headers: { 'Authorization': `Client-ID ${apiKey}` },
      });
      const data = await response.json();
      images = (data.results || []).map(img => ({ url: img.urls.regular, thumb: img.urls.thumb, alt: img.alt_description || query, attribution: `Photo by ${img.user.name} on Unsplash`, source: 'unsplash' }));
    } else if (provider === 'pexels') {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`, {
        headers: { 'Authorization': apiKey },
      });
      const data = await response.json();
      images = (data.photos || []).map(img => ({ url: img.src.large, thumb: img.src.small, alt: img.alt || query, attribution: `Photo by ${img.photographer} on Pexels`, source: 'pexels' }));
    }
    res.json({ images });
  } catch (err) {
    console.error('Admin image search error:', err);
    res.json({ images: [] });
  }
});

// Make admin user (setup)
router.post('/setup-admin', setupLimiter, async (req, res) => {
  const prisma = getPrisma();
  const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (adminExists) return res.status(400).json({ error: 'Admin already exists.' });
  const bcrypt = await import('bcryptjs');
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName) return res.status(400).json({ error: 'Email, password, and first name required.' });
  const hashed = await bcrypt.default.hash(password, 12);
  const user = await prisma.user.create({ data: { email, password: hashed, firstName, lastName: lastName || '', role: 'admin' } });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role } });
});

// Change password
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'No password set for this account.' });
    }
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.default.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const hashed = await bcrypt.default.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ==================== CLIENT PROJECTS ====================
router.get('/projects', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const projects = await prisma.clientProject.findMany({ orderBy: { updatedAt: 'desc' }, include: { _count: { select: { updates: true, messages: true } } } });
    res.json({ projects });
  } catch (err) {
    console.error('Projects error:', err);
    res.status(500).json({ error: 'Failed to load projects.' });
  }
});

router.get('/projects/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.clientProject.findUnique({ where: { id: req.params.id }, include: { updates: { orderBy: { createdAt: 'desc' } }, messages: { orderBy: { createdAt: 'desc' } } } });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project });
  } catch (err) {
    console.error('Project error:', err);
    res.status(500).json({ error: 'Failed to load project.' });
  }
});

router.post('/projects', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.clientProject.create({ data: req.body });
    res.json({ project });
  } catch (err) {
    console.error('Project create error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

router.put('/projects/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const project = await prisma.clientProject.update({ where: { id: req.params.id }, data: req.body });
    res.json({ project });
  } catch (err) {
    console.error('Project update error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

router.delete('/projects/:id', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.clientProject.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Project delete error:', err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// Project updates
router.post('/projects/:id/updates', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const update = await prisma.projectUpdate.create({ data: { ...req.body, projectId: req.params.id } });
    res.json({ update });
  } catch (err) {
    console.error('Project update error:', err);
    res.status(500).json({ error: 'Failed to post update.' });
  }
});

// ==================== CLIENT MESSAGING ====================
router.get('/client-messages', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const { projectId } = req.query;
    const where = projectId ? { projectId } : {};
    const messages = await prisma.clientMessage.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, include: { project: { select: { id: true, title: true } } } });
    const unread = await prisma.clientMessage.count({ where: { ...where, read: false, sender: 'client' } });
    res.json({ messages, unread });
  } catch (err) {
    console.error('Client messages error:', err);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

router.post('/client-messages', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const message = await prisma.clientMessage.create({ data: { ...req.body, sender: 'admin', senderName: req.user.email, read: true } });

    // Email the client so the reply lands in their Gmail (they can reply-all back to us)
    if (message.projectId) {
      const project = await prisma.clientProject.findUnique({ where: { id: message.projectId } });
      if (project?.clientEmail) {
        notifyClientNewMessage({ clientEmail: project.clientEmail, clientName: project.clientName, projectTitle: project.title, content: message.content });
      }
    }

    res.json({ message });
  } catch (err) {
    console.error('Client message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

router.patch('/client-messages/:id/read', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.clientMessage.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ success: true });
  } catch (err) {
    console.error('Message read error:', err);
    res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

// ==================== PAGE VISITS / ANALYTICS ====================
router.post('/visits', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { page, referrer } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await prisma.pageVisit.create({ data: { page, ip, userAgent, referrer } });
    res.json({ success: true });
  } catch (err) {
    console.error('Visit tracking error:', err);
    res.json({ success: false });
  }
});

router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [totalVisits, todayVisits, weekVisits, monthVisits, visitsByPage] = await Promise.all([
      prisma.pageVisit.count(),
      prisma.pageVisit.count({ where: { createdAt: { gte: today } } }),
      prisma.pageVisit.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.pageVisit.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.pageVisit.groupBy({ by: ['page'], _count: true, orderBy: { _count: { page: 'desc' } }, take: 10 }),
    ]);

    // Visits per day for last 7 days
    const dailyVisits = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today); dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.pageVisit.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } });
      dailyVisits.push({ date: dayStart.toISOString().split('T')[0], count });
    }

    // Top referrers
    const referrers = await prisma.pageVisit.groupBy({ by: ['referrer'], _count: true, orderBy: { _count: { referrer: 'desc' } }, where: { referrer: { not: null } }, take: 5 });

    res.json({ totalVisits, todayVisits, weekVisits, monthVisits, visitsByPage, dailyVisits, referrers });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

export default router;
