/* auth.js — Authentication state, login/register, social OAuth, avatar */
export function initAuth() {
  checkAuthState();
  initLoginModal();
}

async function checkAuthState() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    updateAuthUI(data.user);
  } catch {
    updateAuthUI(null);
  }
}

function updateAuthUI(user) {
  const authButtons = document.getElementById('authButtons');
  const authAvatar = document.getElementById('authAvatar');
  const avatarEl = document.getElementById('userAvatar');
  const dashboardLink = document.getElementById('dashboardLink');
  const mobileDashboardLink = document.getElementById('mobileDashboardLink');

  if (!authButtons || !authAvatar) return;

  if (user) {
    authButtons.style.display = 'none';
    authAvatar.style.display = 'flex';

    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.firstName)}">`;
      } else {
        avatarEl.textContent = user.firstName?.charAt(0)?.toUpperCase() || '?';
      }
    }
    const isAdmin = user.role === 'admin';
    const dashboardUrl = isAdmin ? '/admin' : '/dashboard';
    const linkText = isAdmin ? 'Admin Panel' : 'Dashboard';
    if (dashboardLink) {
      dashboardLink.href = dashboardUrl;
      dashboardLink.textContent = linkText;
      dashboardLink.style.display = 'inline-block';
    }
    if (mobileDashboardLink) {
      mobileDashboardLink.href = dashboardUrl;
      mobileDashboardLink.textContent = linkText;
      mobileDashboardLink.style.display = 'block';
    }
  } else {
    authButtons.style.display = 'flex';
    authAvatar.style.display = 'none';
    if (dashboardLink) {
      dashboardLink.style.display = 'none';
    }
    if (mobileDashboardLink) {
      mobileDashboardLink.style.display = 'none';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initLoginModal() {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;

  // Create login modal
  const modal = document.createElement('div');
  modal.id = 'loginModal';
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', 'Login');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__backdrop" data-close-modal></div>
    <div class="modal__content card">
      <button class="modal__close" data-close-modal aria-label="Close login">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>
      </button>
      <h3 style="margin-bottom:var(--space-lg);">Welcome Back</h3>
      <div id="loginForm">
        <div class="input-group">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" class="input" placeholder="you@example.com" required>
        </div>
        <div class="input-group">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" class="input" placeholder="••••••••" required>
        </div>
        <button class="btn btn--primary" style="width:100%;margin-bottom:var(--space-lg);" id="loginSubmit">Login</button>
        <div class="divider"></div>
        <p style="text-align:center;font-size:var(--text-sm);margin-bottom:var(--space-md);">Or continue with</p>
        <div class="flex gap-md" style="justify-content:center;">
          <a href="/api/auth/google" class="btn btn--secondary btn--sm" style="flex:1;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </a>
          <a href="/api/auth/github" class="btn btn--secondary btn--sm" style="flex:1;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
        <p style="text-align:center;margin-top:var(--space-lg);font-size:var(--text-sm);color:var(--color-text-muted);">
          Don't have an account? <a href="#" id="showRegister" style="color:var(--color-accent);">Register</a>
        </p>
      </div>
      <div id="registerForm" style="display:none;">
        <div class="grid grid-2" style="gap:var(--space-md);">
          <div class="input-group">
            <label for="regFirstName">First Name</label>
            <input type="text" id="regFirstName" class="input" placeholder="John" required>
          </div>
          <div class="input-group">
            <label for="regLastName">Last Name</label>
            <input type="text" id="regLastName" class="input" placeholder="Doe">
          </div>
        </div>
        <div class="input-group">
          <label for="regEmail">Email</label>
          <input type="email" id="regEmail" class="input" placeholder="you@example.com" required>
        </div>
        <div class="input-group">
          <label for="regPassword">Password</label>
          <input type="password" id="regPassword" class="input" placeholder="••••••••" required>
        </div>
        <button class="btn btn--primary" style="width:100%;" id="registerSubmit">Create Account</button>
        <p style="text-align:center;margin-top:var(--space-lg);font-size:var(--text-sm);color:var(--color-text-muted);">
          Already have an account? <a href="#" id="showLogin" style="color:var(--color-accent);">Login</a>
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Open modal
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(modal);
  });

  // Close modal
  modal.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => closeModal(modal));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.getAttribute('aria-hidden')) {
      closeModal(modal);
    }
  });

  // Toggle login/register
  document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  });
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  });

  // Login submit
  document.getElementById('loginSubmit')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return showToast('Please fill in all fields.', 'error');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        closeModal(modal);
        showToast('Welcome back!');
        // Redirect admins to admin panel, regular users stay on current page
        if (data.user && data.user.role === 'admin') {
          window.location.href = '/admin';
          return;
        }
        updateAuthUI(data.user);
      } else {
        showToast(data.error || 'Login failed.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  });

  // Register submit
  document.getElementById('registerSubmit')?.addEventListener('click', async () => {
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    if (!firstName || !email || !password) return showToast('Please fill in required fields.', 'error');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        closeModal(modal);
        showToast('Account created! Welcome to Webore.');
        updateAuthUI(data.user);
      } else {
        showToast(data.error || 'Registration failed.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  });
}

function openModal(modal) {
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('input')?.focus();
}

function closeModal(modal) {
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast--${type} show`;
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// Export for use in other modules
window.showToast = showToast;

// Logout handler (for nav bar logout links)
document.addEventListener('click', async (e) => {
  if (e.target.id === 'navLogoutBtn' || e.target.closest('#navLogoutBtn')) {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      showToast('Logout failed.', 'error');
    }
  }
});
