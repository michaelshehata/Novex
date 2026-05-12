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

// Add search functionality
function setupSearch() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) return;

    let allPosts = [];

    // Store original posts for filtering
    async function storeOriginalPosts() {
        try {
            const response = await fetch('/posts', { credentials: 'include' });
            if (response.ok) {
                const posts = await response.json();
                allPosts = posts;
            }
        } catch (err) {
            console.error('Failed to load posts:', err);
        }
    }

    // Filter posts based on search query
    function filterPosts(query) {
        if (!query.trim()) {
            loadPosts(); // Reload original posts
            return;
        }

        const filtered = allPosts.filter(post =>
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            (post.username && post.username.toLowerCase().includes(query.toLowerCase()))
        );

        displayFilteredPosts(filtered);
    }

    // Display filtered posts
    function displayFilteredPosts(posts) {
        const container = document.getElementById('posts_container');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="no-results-message">
                    <p>No discussions found matching your search.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        posts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'blog-post';
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
        });
    }

    // Initialize search
    storeOriginalPosts();

    // Add event listener for real-time filtering
    searchBar.addEventListener('input', (e) => {
        filterPosts(e.target.value);
    });
}

// Call setupSearch after loadPosts completes
loadPosts().then(() => {
    setupSearch();
});
