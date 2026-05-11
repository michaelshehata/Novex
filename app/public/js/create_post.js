async function getCsrfToken() {
    const res =
        await fetch('/auth/csrf-token');

    const data =
        await res.json();

    return data.csrfToken;
}

(async () => {
    const session =
        await protectPage();

    if (!session) return;
})();

const form =
    document.getElementById('create_post_form');

const message =
    document.getElementById('post_message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    message.textContent = '';

    try {
        const csrfToken =
            await getCsrfToken();

        const title =
            document.getElementById('title').value;

        const content =
            document.getElementById('content').value;

        const res = await fetch('/posts', {
            method: 'POST',
            credentials: 'include',

            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },

            body: JSON.stringify({
                title,
                content,
                _csrf: csrfToken
            })
        });

        if (res.ok) {
            message.textContent =
                'Post created successfully.';

            form.reset();
            return;
        }

        message.textContent =
            await res.text();

    } catch (err) {
        console.error(err);

        message.textContent =
            'Network error.';
    }
});