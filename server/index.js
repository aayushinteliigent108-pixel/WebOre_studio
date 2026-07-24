// server/index.js — Main Express server entry point
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production if secrets are not set
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'webore-jwt-secret') {
    console.error('FATAL: JWT_SECRET must be set in production. Aborting.');
    process.exit(1);
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'webore-dev-secret') {
    console.error('FATAL: SESSION_SECRET must be set in production. Aborting.');
    process.exit(1);
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'webore-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Static files
app.use(express.static(join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', apiRoutes);
app.use('/admin/api', adminRoutes);

// Page routes
app.get('/pricing', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'pricing.html')));
app.get('/portfolio', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'portfolio.html')));
app.get('/contact', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'contact.html')));
app.get('/services', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'services.html')));
app.get('/about', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'about.html')));
app.get('/dashboard', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'dashboard.html')));
app.get('/policy', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'policy.html')));
app.get('/policies', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'policies.html')));
app.get('/policies/:slug', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'policy.html')));
app.get('/login', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'login.html')));
app.get('/admin', (req, res) => res.sendFile(join(__dirname, '..', 'public', 'admin.html')));

// 404 handler — serve 404.html for unknown routes
app.use((req, res) => {
  res.status(404).sendFile(join(__dirname, '..', 'public', '404.html'));
});

// Init DB and start
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Webore server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
