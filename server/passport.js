// server/passport.js — Passport.js strategies for Google, Facebook, GitHub OAuth
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { getPrisma } from './db.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Helper to find or create user from OAuth profile
async function findOrCreateUser(profile, provider) {
  const prisma = getPrisma();
  const email = profile.emails?.[0]?.value;
  const providerId = profile.id;
  const avatar = profile.photos?.[0]?.value || null;
  const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || profile.username || 'User';
  const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';

  // Check if user already exists with this provider
  let user = await prisma.user.findFirst({ where: { provider, providerId } });
  if (user) return user;

  // Check if user exists with this email
  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Link this OAuth provider to existing account
      return prisma.user.update({ where: { id: user.id }, data: { provider, providerId, avatar } });
    }
  }

  // Create new user
  return prisma.user.create({
    data: { email, firstName, lastName, avatar, provider, providerId },
  });
}

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  try {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/google/callback`,
      proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile, 'google');
        done(null, user);
      } catch (err) {
        console.error('Google OAuth error:', err);
        done(err, null);
      }
    }));
    console.log('Google OAuth strategy loaded.');
  } catch (err) {
    console.error('Failed to load Google OAuth strategy:', err.message);
  }
} else {
  console.log('Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET).');
}

// Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && process.env.FACEBOOK_APP_ID !== 'your-facebook-app-id') {
  try {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${BASE_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile, 'facebook');
        done(null, user);
      } catch (err) {
        console.error('Facebook OAuth error:', err);
        done(err, null);
      }
    }));
    console.log('Facebook OAuth strategy loaded.');
  } catch (err) {
    console.error('Failed to load Facebook OAuth strategy:', err.message);
  }
} else {
  console.log('Facebook OAuth not configured (missing or placeholder credentials).');
}

// GitHub OAuth
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  try {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/github/callback`,
      scope: ['user:email'],
      proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile, 'github');
        done(null, user);
      } catch (err) {
        console.error('GitHub OAuth error:', err);
        done(err, null);
      }
    }));
    console.log('GitHub OAuth strategy loaded.');
  } catch (err) {
    console.error('Failed to load GitHub OAuth strategy:', err.message);
  }
} else {
  console.log('GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET).');
}

export default passport;
