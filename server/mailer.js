// server/mailer.js — Central email helper. Uses Resend (https://resend.com).
// Set RESEND_API_KEY and RESEND_FROM_EMAIL in .env.
import { Resend } from 'resend';

let resend = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getClient() {
  if (resend) return resend;
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('[mailer] RESEND_API_KEY not configured — emails will be skipped. Set RESEND_API_KEY in .env.');
    return null;
  }
  resend = new Resend(RESEND_API_KEY);
  return resend;
}

// Fire-and-forget — never throw, never block the API response on email failure.
export async function sendMail({ to, subject, html, replyTo }) {
  try {
    const client = getClient();
    if (!client) return { skipped: true };
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const result = await client.emails.send({
      from: `Webore Studio <${from}>`,
      to,
      subject,
      html,
      reply_to: replyTo,
    });
    if (result.error) {
      console.error('[mailer] send failed:', result.error.message);
      return { sent: false, error: result.error.message };
    }
    return { sent: true, id: result.data?.id };
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return { sent: false, error: err.message };
  }
}

const ADMIN_EMAIL = () => process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_EMAIL || 'webore1007@gmail.com';

export function notifyAdminNewLead({ name, email, phone, projectType, budget, message }) {
  return sendMail({
    to: ADMIN_EMAIL(),
    replyTo: email,
    subject: `📬 New Contact Lead — ${escapeHtml(name)}`,
    html: `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${escapeHtml(name)}<br/>
      <b>Email:</b> ${escapeHtml(email)}<br/>
      <b>Phone:</b> ${escapeHtml(phone) || '—'}<br/>
      <b>Project Type:</b> ${escapeHtml(projectType)}<br/>
      <b>Budget:</b> ${escapeHtml(budget) || '—'}</p>
      <p><b>Message:</b><br/>${escapeHtml(message || '').replace(/\n/g, '<br/>')}</p>
      <p>Reply to this email to reply directly to ${escapeHtml(email)}.</p>
    `,
  });
}

export function notifyAdminNewProject({ title, clientName, clientEmail, description, projectType, budget, timeline }) {
  return sendMail({
    to: ADMIN_EMAIL(),
    replyTo: clientEmail,
    subject: `🗂️ New Project Request — ${escapeHtml(title)}`,
    html: `
      <h2>New "Start a Project" Submission</h2>
      <p><b>Client:</b> ${escapeHtml(clientName)} (${escapeHtml(clientEmail)})<br/>
      <b>Project Type:</b> ${escapeHtml(projectType) || '—'}<br/>
      <b>Budget:</b> ${escapeHtml(budget) || '—'}<br/>
      <b>Timeline:</b> ${escapeHtml(timeline) || '—'}</p>
      <p><b>Details:</b><br/>${escapeHtml(description || '').replace(/\n/g, '<br/>')}</p>
      <p>View and manage this in your admin panel under Client Projects.</p>
    `,
  });
}

export function notifyClientProjectReceived({ clientEmail, clientName, title }) {
  return sendMail({
    to: clientEmail,
    subject: `We received your project request — Webore`,
    html: `
      <h2>Thanks, ${escapeHtml(clientName)}! 🎉</h2>
      <p>We've received your project request for <b>${escapeHtml(title)}</b>. Our team will review the details and get back to you within 24 hours.</p>
      <p>— The Webore Team</p>
    `,
  });
}

// Sent when an admin replies to a client inside Client Messages, so the
// client sees the reply as a normal Gmail email (and can reply back).
export function notifyClientNewMessage({ clientEmail, clientName, projectTitle, content }) {
  return sendMail({
    to: clientEmail,
    subject: `New reply on your project${projectTitle ? ` — ${escapeHtml(projectTitle)}` : ''}`,
    html: `
      <h2>Hi ${escapeHtml(clientName) || ''},</h2>
      <p>You have a new message from Webore${projectTitle ? ` about <b>${escapeHtml(projectTitle)}</b>` : ''}:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#333;">${escapeHtml(content || '').replace(/\n/g, '<br/>')}</blockquote>
      <p>Reply to this email and we'll get it.</p>
    `,
  });
}