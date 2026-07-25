// server/routes/chat.js — AI Chat endpoint with trained knowledge base
import { Router } from 'express';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { getPrisma } from '../db.js';

const router = Router();

// Rate limit chat: max 20 per 15 minutes per IP (prevents AI API cost abuse)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many messages. Please wait a moment before trying again.', reply: "I'm getting a lot of messages right now! Give me a minute and try again. 😊" },
  standardHeaders: true,
  legacyHeaders: false,
});

async function buildSystemPrompt() {
  const prisma = getPrisma();
  const configs = await prisma.chatbotConfig.findMany();
  const config = {};
  configs.forEach(c => { try { config[c.key] = JSON.parse(c.value); } catch { config[c.key] = null; } });

  return `You are the official AI representative for Webore — a premium creative digital studio that builds high-end websites.

PERSONA:
- You are "Web" — the friendly, confident face of Webore
- Streetwear-meets-design-studio energy: modern, bold, slightly edgy, never generic corporate
- You speak like a knowledgeable creative director who genuinely cares about the project
- Keep responses concise (2-4 sentences max), punchy, and conversational
- Use emojis naturally but sparingly (1-2 per message max)
- Match the visitor's energy — if they're casual, be casual; if they're professional, be professional
- Never say "As an AI" or "I'm a language model" — you ARE Webore
- Be opinionated about design when appropriate ("honestly, carousels are overused" or "dark mode just hits different")

SERVICES:
${config.services?.map(s => `- **${s.name}**: ${s.description}`).join('\n') || 'Web Design, Web Development, E-commerce, SEO, Maintenance, Branding'}

PRICING TIERS:
${config.pricing?.map(p => `- **${p.name}** (${p.price}): ${p.features.join(', ')}${p.highlighted ? ' ⭐ MOST POPULAR' : ''}`).join('\n') || ''}

PROCESS:
Discovery → Design → Development → Launch. Typical timeline: 2-6 weeks.
We move fast but we don't cut corners. Every project gets a dedicated team.

FAQs:
${config.faqs?.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n') || ''}

WORKING HOURS: ${JSON.stringify(config.working_hours) || 'Weekdays 9AM-6PM'}

COMPANY INFO: ${JSON.stringify(config.company_info) || '{"name":"Webore","email":"webore1007@gmail.com"}'}

CONVERSATION STYLE:
- Open with energy: "Hey! What are we building today?" or "Love it — tell me more!"
- When they describe their project, get excited and specific: "A SaaS dashboard? We actually love those — clean data viz is our thing."
- Qualify naturally: "What's the timeline looking like?" or "Rough budget so I can point you to the right tier?"
- Always end with a clear next step: "Want me to set up a quick call?" or "Fill out the form and we'll hit you back in 24h"
- If they seem price-sensitive, highlight the Starter tier. If they seem ambitious, point to Business or Enterprise.
- Use their name if they share it. Personalization > generic responses.

GUARDRAILS:
- Never quote custom prices outside the published tiers — if they need something custom, say "let's hop on a call"
- Never make specific delivery-date promises — give ranges only
- Never share other clients' private project details
- If you don't know something, say "great question — let me connect you with the team"
- Do not generate harmful, misleading, or inappropriate content
- Never be pushy — be helpful first, sales second

GOAL:
- Make the visitor feel understood and excited about working with Webore
- Qualify leads by naturally asking about project type, budget, and timeline
- Steer toward booking a call or filling the contact form
- If they're just browsing, be helpful and let them know you're here when they're ready
- End every conversation on a high note — even if they're not ready yet

Keep responses concise (2-4 sentences typically). If the user asks something complex, break it down.`;
}

// Send message
router.post('/', chatLimiter, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const prisma = getPrisma();
    const sid = sessionId || uuidv4();

    // Get or create session
    let session = await prisma.chatSession.findUnique({ where: { id: sid }, include: { messages: true } });
    if (!session) {
      session = await prisma.chatSession.create({ data: { id: sid }, include: { messages: true } });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId: sid, role: 'user', content: message },
    });

    // Build conversation history (limit to last 20 messages to prevent token overflow)
    const history = session.messages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: message });
    if (history.length > 20) history.splice(0, history.length - 20);

    // Build system prompt from DB
    const systemPrompt = await buildSystemPrompt();

    // Call AI provider
    const provider = process.env.AI_PROVIDER || 'openai';
    const apiKey = process.env.AI_PROVIDER_API_KEY;

    if (!apiKey) {
      return res.json({
        reply: "Hi! I'm the Webore assistant. I'd love to help you with your project. Could you tell me a bit about what you're looking for? In the meantime, feel free to reach out at webore1007@gmail.com or fill out our contact form!",
        sessionId: sid,
      });
    }

    let reply = '';

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...history],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.choices?.[0]?.message?.content || 'I could not generate a response.';
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: systemPrompt,
          messages: history,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.content?.[0]?.text || 'I could not generate a response.';
    } else if (provider === 'gemini') {
      const contents = history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemPrompt }] } }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
    } else if (provider === 'grok') {
      // Grok (xAI) — OpenAI-compatible API
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...history],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      reply = data.choices?.[0]?.message?.content || 'I could not generate a response.';
    } else if (provider === 'groq') {
      // Groq — OpenAI-compatible API (fast inference)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, ...history],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      reply = data.choices?.[0]?.message?.content || 'I could not generate a response.';
    }

    // Save assistant reply
    await prisma.chatMessage.create({
      data: { sessionId: sid, role: 'assistant', content: reply },
    });

    res.json({ reply, sessionId: sid });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      reply: "I'm having a bit of trouble right now, but don't worry! You can reach us directly at webore1007@gmail.com or fill out our contact form. We'll get back to you quickly!",
      sessionId: req.body.sessionId || uuidv4(),
    });
  }
});

// Get chat history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const prisma = getPrisma();
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ messages });
  } catch (err) {
    console.error('Chat history error:', err);
    res.json({ messages: [] });
  }
});

export default router;
