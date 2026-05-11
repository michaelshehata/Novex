async function getCsrfToken() {
    const res = await fetch('/auth/csrf-token', {
        credentials: 'include'
    });

    const data = await res.json();

    return data.csrfToken;
}

const form =
    document.getElementById('login_form');

const errorEl =
    document.getElementById('login_error');

if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        errorEl.textContent = '';

        try {

            const csrfToken =
                await getCsrfToken();

            const username =
                document.getElementById('username').value;

            const password =
                document.getElementById('password').value;

            const totpCode =
                document.getElementById('totp').value;

            const res = await fetch('/auth/login', {

                method: 'POST',

                credentials: 'include',

                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },

                body: JSON.stringify({
                    username,
                    password,
                    totpCode,
                    _csrf: csrfToken
                })
            });

            if (res.ok) {

                window.location.href =
                    '/dashboard.html';

                return;
            }

            const text =
                await res.text();

            errorEl.textContent =
                text || 'Login failed';

        }

        catch (err) {

            console.error(err);

            errorEl.textContent =
                'Network error';
        }
    });
}