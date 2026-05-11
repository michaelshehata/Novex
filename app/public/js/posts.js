async function loadPosts() {

    const container =
        document.getElementById('posts_container');

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch('/posts', {
                credentials: 'include'
            });

        if (!response.ok) {

            container.innerHTML = `
                <div class="blog-post">
                    <h2 class="blog-post-title">
                        Unable to load posts
                    </h2>
                </div>
            `;

            return;
        }

        const posts =
            await response.json();

        if (!Array.isArray(posts) || posts.length === 0) {

            container.innerHTML = `
                <div class="blog-post">
                    <h2 class="blog-post-title">
                        No posts available
                    </h2>

                    <p class="muted">
                        Be the first to create a discussion.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = '';

        for (const post of posts) {

            const postEl =
                document.createElement('div');

            postEl.className =
                'blog-post';

            postEl.innerHTML = `

                <div class="blog-post-header">

                    <div>

                        <h2 class="blog-post-title">
                            ${escapeHtml(post.title)}
                        </h2>

                        <div class="blog-post-meta">

                            Posted by
                            ${escapeHtml(post.username || 'Unknown')}

                        </div>

                    </div>

                </div>

                <div class="blog-post-content">

                    ${escapeHtml(post.content)}

                </div>

            `;

            container.appendChild(postEl);
        }

    }

    catch (err) {

        console.error(err);

        container.innerHTML = `
            <div class="blog-post">
                <h2 class="blog-post-title">
                    Network Error
                </h2>
            </div>
        `;
    }
}



function escapeHtml(text) {

    const div =
        document.createElement('div');

    div.textContent = text;

    return div.innerHTML;
}



loadPosts();