async function getCsrfToken() {

    const res =
        await fetch('/auth/csrf-token', {
            credentials: 'include'
        });

    const data =
        await res.json();

    return data.csrfToken;
}

const form =
    document.getElementById('register_form');

const errorEl =
    document.getElementById('register_error');

if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        errorEl.textContent = '';

        try {

            const csrfToken =
                await getCsrfToken();

            const username =
                document.getElementById('username').value;

            const email =
                document.getElementById('email').value;

            const password =
                document.getElementById('password').value;

            const res = await fetch('/auth/register', {

                method: 'POST',

                credentials: 'include',

                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },

                body: JSON.stringify({
                    username,
                    email,
                    password,
                    _csrf: csrfToken
                })
            });

            if (res.ok) {

                window.location.href =
                    '/login.html';

                return;
            }

            const text =
                await res.text();

            errorEl.textContent =
                text || 'Registration failed';

        }

        catch (err) {

            console.error(err);

            errorEl.textContent =
                'Network error';
        }
    });
}