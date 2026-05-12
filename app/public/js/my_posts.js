function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

(async () => {
    const session = await protectPage();
    if (!session) return;

    const container = document.getElementById('my_posts_container');

    if (!container) {
        console.error('Container with id "my_posts_container" not found');
        return;
    }

    // Use event delegation for all post actions
    container.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            await handleDeletePost(event);
        } else if (event.target.classList.contains('edit-btn')) {
            await handleEditPost(event);
        }
    });

    async function loadPosts() {
        try {
            console.log('Loading posts from /posts');
            const res = await fetch('/posts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const posts = await res.json();
            console.log('Posts data:', posts);

            const mine = posts.filter(p => p.user_id === session.userId);
            console.log('User posts count:', mine.length);

            // Clear the container but preserve the structure
            container.innerHTML = '';

            if (mine.length === 0) {
                container.innerHTML = `
                    <div class="blog-post">
                        <h2>You have no posts yet</h2>
                        <p>Start by creating your first post!</p>
                    </div>
                `;
                return;
            }

            // Create a fragment to improve performance
            const fragment = document.createDocumentFragment();

            mine.forEach(post => {
                const card = document.createElement('div');
                card.className = 'blog-post';

                card.innerHTML = `
                    <div class="blog-post-header">
                        <div>
                            <h2 class="blog-post-title">${escapeHtml(post.title)}</h2>
                            <div class="blog-post-meta">
                                Posted ${new Date(post.created_at || post.updated_at).toLocaleDateString()} • Secure Session Verified
                            </div>
                        </div>
                    </div>
                    <div class="blog-post-content">
                        ${escapeHtml(post.content)}
                    </div>
                    <div class="post-actions">
                        <button class="post-btn edit-btn" data-id="${post.id}">Edit</button>
                        <button class="post-btn delete-btn" data-id="${post.id}">Delete</button>
                    </div>
                `;

                fragment.appendChild(card);
            });

            container.appendChild(fragment);
            console.log('Posts loaded successfully');

        } catch (error) {
            console.error('Error loading posts:', error);
            container.innerHTML = '<div class="blog-post"><p>Error loading posts. Please try again.</p></div>';
        }
    }

    async function handleDeletePost(event) {
        const postId = event.target.dataset.id;
        console.log('Attempting to delete post with ID:', postId);
        console.log('Session userId:', session.userId);

        if (!confirm('Are you sure you want to delete this post?')) {
            console.log('Delete cancelled by user');
            return;
        }

        try {
            console.log('Sending DELETE request to /posts/' + postId);

            // Fetch CSRF token before every state changing request
            const csrfRes   = await fetch('/auth/csrf-token', { credentials: 'include' });
            const csrfData  = await csrfRes.json();
            const csrfToken = csrfData.csrfToken;

            const res = await fetch(`/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include'
            });

            console.log('Delete response status:', res.status);
            const responseText = await res.text();
            console.log('Delete response text:', responseText);

            if (res.ok) {
                console.log('Post deleted successfully');
                // Reload posts after successful deletion
                await loadPosts();
                alert('Post deleted successfully!');
            } else {
                console.error('Delete failed with status:', res.status, 'Response:', responseText);
                throw new Error(`Failed to delete post: ${res.status} - ${responseText}`);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post. Please try again.\n' + error.message);
        }
    }

    async function handleEditPost(event) {
        const postId = event.target.dataset.id;
        console.log('Navigating to edit post:', postId);
        window.location.href = `/edit_post?id=${postId}`;
    }

    await loadPosts();
})();
