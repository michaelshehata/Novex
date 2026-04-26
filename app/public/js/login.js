// Client side check only, server uses the same response for failed login .

let csrfTokenLoaded = false;
let csrfTokenLoadFailed = false;

async function loadCsrfToken() {
    const tokenInput = document.getElementById('csrf_token');
    if (!tokenInput) return;

    const loginButton = document.getElementById('login_btn');
    if (loginButton) {
        loginButton.disabled = true;
    }


    try {
        const response = await fetch('/auth/csrf-token');
        if (!response.ok) {
            csrfTokenLoadFailed = true;
            return;
        }

        const data = await response.json();
        tokenInput.value = data.csrfToken;
        csrfTokenLoaded = true;
        csrfTokenLoadFailed = false;

        if (loginButton) {
            loginButton.disabled = false;
        }
    } catch (err) {
        csrfTokenLoadFailed = true;
        console.error('Failed to load CSRF token:', err);
    }
}

document.getElementById('login_form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username_input').value.trim();
    const password = document.getElementById('password_input').value;
    const token = document.getElementById('csrf_token').value;

    let el = document.getElementById('login_error');
    if (el) el.remove();

    if (!csrfTokenLoaded || !token || csrfTokenLoadFailed) {
        el = document.createElement('p');
        el.id = 'login_error';
        el.textContent = 'Security token is still loading. Please wait.';
        el.classList.add('error');
        document.querySelector('#login_btn').parentNode.insertBefore(el, document.querySelector('#login_btn'));
        return;
    }

    if (!username || !password) {
        el = document.createElement('p');
        el.id = 'login_error';
        el.textContent = 'Please fill out the login fields.';
        el.classList.add('error');
        document.querySelector('#login_btn').parentNode.insertBefore(el, document.querySelector('#login_btn'));
        return;
    }

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                _csrf: token
            })
        });

        if (response.ok) {
            window.location.href = '/html/index.html';
        } else {
            const text = await response.text();
            el = document.createElement('p');
            el.id = 'login_error';
            el.textContent = text;
            el.classList.add('error');
            document.querySelector('#login_btn').parentNode.insertBefore(el, document.querySelector('#login_btn'));
        }

    } catch (err) {
        console.error(err);
    }
});