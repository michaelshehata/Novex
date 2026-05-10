async function getCsrfToken() {
  const response = await fetch('/auth/csrf-token');
  if (!response.ok) return null;
  const data = await response.json();
  return data.csrfToken;
}



function showMsg(el, text, isError) {
  if (!el) return;
  el.textContent = text;
  el.style.display = text ? 'block' : 'none';
  el.classList.toggle('error', Boolean(isError));
}



async function initMfaPanel() {
  const statusEl = document.getElementById('mfa_status');
  const msgEl = document.getElementById('mfa_message');
  const startBtn = document.getElementById('mfa_start_setup');
  const enablePanel = document.getElementById('mfa_enable_panel');
  const disablePanel = document.getElementById('mfa_disable_panel');
  const otpauthLink = document.getElementById('mfa_otpauth');
  const secretEl = document.getElementById('mfa_secret');
  const confirmInput = document.getElementById('mfa_confirm_code');
  const confirmBtn = document.getElementById('mfa_confirm_btn');
  const cancelBtn = document.getElementById('mfa_cancel_setup');
  const disablePwd = document.getElementById('mfa_disable_password');
  const disableBtn = document.getElementById('mfa_disable_btn');


  if (!statusEl || !startBtn) return;

  let session;
  try {
    const r = await fetch('/api/session');
    if (!r.ok) {
      showMsg(statusEl, 'Could not load account.', true);
      startBtn.hidden = true;
      return;
    }
    session = await r.json();
  } catch {
    showMsg(statusEl, 'Could not load account.', true);
    startBtn.hidden = true;
    return;
  }

  
  if (!session.loggedIn) {
    showMsg(statusEl, 'Log in to manage two-step sign-in.', false);
    startBtn.hidden = true;
    return;
  }

  function applyTotpState(enabled) {
    showMsg(msgEl, '', false);
    if (enabled) {
      statusEl.textContent =
        'Two-step sign-in is on. You will need a code from your authenticator app when you log in.';
      startBtn.hidden = true;
      enablePanel.hidden = true;
      disablePanel.hidden = false;
    } else {
      statusEl.textContent =
        'Two-step sign-in is off. You can turn it on with an authenticator app (Google Authenticator, Microsoft Authenticator, etc.).';
      startBtn.hidden = false;
      enablePanel.hidden = true;
      disablePanel.hidden = true;
    }
  }

  applyTotpState(session.totpEnabled);

  startBtn.addEventListener('click', async () => {
    showMsg(msgEl, '', false);
 // Setup write to the server state, then we can include the CSRF token like other protected routes.
    const token = await getCsrfToken();
    if (!token) {
      showMsg(msgEl, 'Could not load security token. Refresh the page.', true);
      return;
    }
    try {
      const res = await fetch('/auth/mfa/setup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({ _csrf: token }),
      });
      if (!res.ok) {
        showMsg(msgEl, 'Could not start setup. Try again.', true);
        return;
      }
      const data = await res.json();
      otpauthLink.href = data.otpauth_url || '#';
      otpauthLink.textContent = 'Open in authenticator app';
      secretEl.textContent = data.secret_base32 || '';
      confirmInput.value = '';
      enablePanel.hidden = false;
      startBtn.hidden = true;
      disablePanel.hidden = true;
    } catch {
      showMsg(msgEl, 'Network error.', true);
    }
  });

  cancelBtn?.addEventListener('click', () => {
    enablePanel.hidden = true;
    startBtn.hidden = session.totpEnabled;
    showMsg(msgEl, '', false);
  });

  confirmBtn?.addEventListener('click', async () => {
    showMsg(msgEl, '', false);
    const code = (confirmInput.value || '').trim();
    if (!/^\d{6}$/.test(code)) {
      showMsg(msgEl, 'Enter the 6-digit code from your app.', true);
      return;
    }
    const token = await getCsrfToken();
    if (!token) {
      showMsg(msgEl, 'Could not load security token.', true);
      return;
    }
    try {
      const res = await fetch('/auth/mfa/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({ totpCode: code, _csrf: token }),
      });
      if (!res.ok) {
        const t = await res.text();
        showMsg(msgEl, t || 'Invalid code. Try again.', true);
        return;
      }
      session.totpEnabled = true;
      applyTotpState(true);
      enablePanel.hidden = true;
      showMsg(msgEl, 'Two-step sign-in is now on.', false);
    } catch {
      showMsg(msgEl, 'Network error.', true);
    }
  });

  disableBtn?.addEventListener('click', async () => {
    showMsg(msgEl, '', false);
    const password = disablePwd.value || '';
    if (!password) {
      showMsg(msgEl, 'Enter your password to turn off two-step sign-in.', true);
      return;
    }
    const token = await getCsrfToken();
    if (!token) {
      showMsg(msgEl, 'Could not load security token.', true);
      return;
    }
    try {
      const res = await fetch('/auth/mfa/disable', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({ password, _csrf: token }),
      });
      if (!res.ok) {
        const t = await res.text();
        showMsg(msgEl, t || 'Could not turn off two-step sign-in.', true);
        return;
      }
      session.totpEnabled = false;
      disablePwd.value = '';
      applyTotpState(false);
      showMsg(msgEl, 'Two-step sign-in is now off.', false);
    } catch {
      showMsg(msgEl, 'Network error.', true);
    }
  });
}

initMfaPanel();
