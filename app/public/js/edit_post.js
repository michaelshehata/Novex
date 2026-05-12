async function getCsrfToken() {
    const res = await fetch('/auth/csrf-token', { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken;
}

(async () => {
    const session = await protectPage();
    if (!session) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        window.location.href = '/my_posts';
        return;
    }

    const errorEl = document.getElementById('edit_error');

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }

    // Load existing post data
    try {
        const res = await fetch(`/posts/${postId}`, { credentials: 'include' });

        if (res.status === 404 || res.status === 403) {
            window.location.href = '/my_posts';
            return;
        }

        if (!res.ok) {
            showError('Failed to load post.');
            return;
        }

        const post = await res.json();
        document.getElementById('post_title').value = post.title;
        document.getElementById('post_content').value = post.content;

    } catch (err) {
        console.error(err);
        showError('Network error loading post.');
        return;
    }

    // Submit updated post
    const form = document.getElementById('edit_post_form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';

        try {
            const csrfToken = await getCsrfToken();

            const title = document.getElementById('post_title').value;
            const content = document.getElementById('post_content').value;

            const res = await fetch(`/posts/${postId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ title, content, _csrf: csrfToken })
            });

            if (res.ok) {
                window.location.href = '/my_posts';
                return;
            }

            const text = await res.text();
            showError(text || 'Failed to update post.');

        } catch (err) {
            console.error(err);
            showError('Network error.');
        }
    });
})();
