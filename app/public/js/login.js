// Client side check only, server uses the same response for failed login .

async function loadCsrfToken() {
    const tokenInput = document.getElementById('csrf_token');
    if (!tokenInput) return;

    try {
        const response = await fetch('/auth/csrf-token');
        if (!response.ok) return;

        const data = await response.json();
        tokenInput.value = data.csrfToken;
    } catch (err) {
        console.error('Failed to load CSRF token:', err);
    }
}

document.getElementById('login_form')?.addEventListener('submit', function (e) {
    const username = document.getElementById('username_input').value.trim();
    const password = document.getElementById('password_input').value;

    if (!username || !password) {
        e.preventDefault();
        let el = document.getElementById('login_error');
        if (el) el.remove();
        el = document.createElement('p');
        el.id = 'login_error';
        el.textContent = 'Please fill out the login fields.';
        el.classList.add('error');
        document.querySelector('#login_btn').parentNode.insertBefore(el, document.querySelector('#login_btn'));
    }
});

loadCsrfToken();
