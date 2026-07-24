/* forms.js — Contact form and newsletter handling */
export function initForms() {
  initContactForm();
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('contactSubmit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    const name = form.querySelector('[name="name"]')?.value?.trim();
    const email = form.querySelector('[name="email"]')?.value?.trim();
    const projectType = form.querySelector('[name="projectType"]')?.value;
    const message = form.querySelector('[name="message"]')?.value?.trim();

    if (!name || !email || !projectType || !message) {
      window.showToast?.('Please fill in all required fields.', 'error');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.showToast?.('Please enter a valid email address.', 'error');
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

    try {
      const data = {
        name,
        email,
        phone: form.querySelector('[name="phone"]')?.value?.trim() || undefined,
        projectType,
        budget: form.querySelector('[name="budget"]')?.value || undefined,
        message,
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        window.showToast?.(result.message || 'Message sent!');
        form.reset();
      } else {
        window.showToast?.(result.error || 'Failed to send message.', 'error');
      }
    } catch {
      window.showToast?.('Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Send Message <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    }
  });
}
