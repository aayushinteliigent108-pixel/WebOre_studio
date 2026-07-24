/* chat.js — Shared AI chat core for both floating widget and inline section */
export function initChat() {
  // Shared session state
  let sessionId = localStorage.getItem('chatSessionId') || null;

  // ===== SHARED CORE =====
  async function sendMessage(text, messagesContainer, inputEl, chipsContainer) {
    renderMessage(text, 'user', messagesContainer);
    if (inputEl) inputEl.value = '';
    if (chipsContainer) chipsContainer.style.display = 'none';

    const typingEl = appendTyping(messagesContainer);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      typingEl.remove();
      if (data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem('chatSessionId', sessionId);
      }
      renderMessage(data.reply, 'bot', messagesContainer);

      // Show contextual quick replies (only for widget)
      const lower = text.toLowerCase();
      if (lower.includes('pric') || lower.includes('cost') || lower.includes('how much')) {
        setTimeout(() => showQuickReplies(['Tell me about Business tier', 'Do you do custom quotes?', 'Let\'s schedule a call'], messagesContainer), 500);
      } else if (lower.includes('service') || lower.includes('what do')) {
        setTimeout(() => showQuickReplies(['Tell me about SEO', 'E-commerce solutions', 'I need branding'], messagesContainer), 500);
      } else if (lower.includes('start') || lower.includes('project') || lower.includes('build')) {
        setTimeout(() => showQuickReplies(['Fill out the contact form', 'What\'s the timeline?', 'Show me your portfolio'], messagesContainer), 500);
      }
    } catch {
      typingEl.remove();
      renderMessage("Hey, I'm having a small hiccup right now 😅 Try again in a sec, or email us at webore1007@gmail.com — we'll get back to you fast!", 'bot', messagesContainer);
    }
  }

  function renderMessage(text, role, container) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${role}`;
    const formatted = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    div.innerHTML = `<div class="chat-msg__bubble">${formatted}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function appendTyping(container) {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--bot';
    div.innerHTML = '<div class="chat-msg__bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function showQuickReplies(options, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-quick-replies';

    options.forEach(text => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.addEventListener('click', () => {
        wrapper.remove();
        sendMessage(text, container, null, null);
      });
      wrapper.appendChild(btn);
    });

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== FLOATING WIDGET =====
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const close = document.getElementById('chatClose');
  const widgetForm = document.getElementById('chatForm');
  const widgetInput = document.getElementById('chatInput');
  const widgetMessages = document.getElementById('chatMessages');

  if (toggle && panel) {
    let hasGreeted = false;

    toggle.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      panel.setAttribute('aria-hidden', !isOpen);
      if (isOpen) {
        widgetInput?.focus();
        widgetMessages.scrollTop = widgetMessages.scrollHeight;
        if (!hasGreeted) {
          hasGreeted = true;
          setTimeout(() => {
            showQuickReplies(['What services do you offer?', 'Show me pricing', 'I want to start a project'], widgetMessages);
          }, 800);
        }
      }
    });

    close?.addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      toggle.focus();
    });

    widgetForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = widgetInput.value.trim();
      if (!text) return;
      sendMessage(text, widgetMessages, widgetInput, null);
    });
  }

  // ===== INLINE SECTION (homepage only) =====
  const inlineSection = document.getElementById('inlineChat');
  if (inlineSection) {
    const inlineMessages = document.getElementById('inlineChatMessages');
    const inlineInput = document.getElementById('inlineChatInput');
    const inlineForm = document.getElementById('inlineChatForm');
    const inlineChips = document.getElementById('inlineChatChips');

    if (inlineForm && inlineMessages) {
      inlineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = inlineInput.value.trim();
        if (!text) return;
        sendMessage(text, inlineMessages, inlineInput, inlineChips);
      });

      // Chip click handlers
      inlineChips?.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          sendMessage(btn.textContent, inlineMessages, inlineInput, inlineChips);
        });
      });
    }
  }
}
