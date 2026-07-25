// server/routes/auth.js — Authentication routes (email/password + OAuth)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import passport from '../passport.js';
import { getPrisma } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET required in production'); })() : 'webore-jwt-secret');

const isProduction = process.env.NODE_ENV === 'production';

// Rate limit login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit registration: max 5 per 15 minutes per IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function logLogin(email, ip, device, provider, status, userId) {
  const prisma = getPrisma();

  const data = {
    email,
    ip,
    device,
    provider,
    status,
  };

  if (userId) {
    data.user = {
      connect: {
        id: userId,
      },
    };
  }

  prisma.loginLog.create({ data }).catch(console.error);
}

// Register
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Email, password, and first name are required.' });
    }
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName: lastName || '' },
    });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    logLogin(email, req.ip, req.headers['user-agent'], 'email', 'success', user.id);
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      logLogin(email, req.ip, req.headers['user-agent'], 'email', 'failed', user?.id || null);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logLogin(email, req.ip, req.headers['user-agent'], 'email', 'failed', user.id);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    logLogin(email, req.ip, req.headers['user-agent'], 'email', 'success', user.id);
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
});

// Get current user
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ user: null });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.json({ user: null });
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, role: user.role } });
  } catch {
    res.json({ user: null });
  }
});

// Google OAuth
router.get('/google', (req, res, next) => {
  if (!passport._strategies.google) {
    return res.status(503).json({ error: 'Google login is not configured.' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }, (err, user) => {
    if (err || !user) {
      return res.redirect('/login?error=google_failed');
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    logLogin(user.email, req.ip, req.headers['user-agent'], 'google', 'success', user.id);
    res.redirect('/');
  })(req, res, next);
});

// Facebook OAuth
router.get('/facebook', (req, res, next) => {
  if (!passport._strategies.facebook) {
    return res.status(503).json({ error: 'Facebook login is not configured.' });
  }
  passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
});
router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { failureRedirect: '/login?error=facebook_failed' }, (err, user) => {
    if (err || !user) {
      return res.redirect('/login?error=facebook_failed');
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    logLogin(user.email, req.ip, req.headers['user-agent'], 'facebook', 'success', user.id);
    res.redirect('/');
  })(req, res, next);
});

// GitHub OAuth
router.get('/github', (req, res, next) => {
  if (!passport._strategies.github) {
    return res.status(503).json({ error: 'GitHub login is not configured.' });
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});
router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { failureRedirect: '/login?error=github_failed' }, (err, user) => {
    if (err || !user) {
      return res.redirect('/login?error=github_failed');
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    logLogin(user.email, req.ip, req.headers['user-agent'], 'github', 'success', user.id);
    res.redirect('/');
  })(req, res, next);
});

// Check OAuth status (for debugging)
router.get('/status', (req, res) => {
  res.json({
    google: !!passport._strategies?.google,
    facebook: !!passport._strategies?.facebook,
    github: !!passport._strategies?.github,
  });
});

export default router;
