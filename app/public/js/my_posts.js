async function getCsrfToken() {
    const res = await fetch('/auth/csrf-token', {
        credentials: 'include'
    });
    const data = await res.json();
    return data.csrfToken;
}

(async () => {
    const session = await protectPage();
    if (!session) return;

    const container = document.getElementById('my_posts_container');

    if (!container) {
        console.error('Container with id "my_posts_container" not found');
        return;
    }

    // Create search bar element
    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.placeholder = 'Search your posts...';
    searchBar.className = 'search-bar';
    searchBar.style.display = 'none'; // Hidden by default
    searchBar.style.marginBottom = '1.5rem';

    // Create no results message element
    const noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'no-results-message';
    noResultsMessage.textContent = 'No posts found matching your search.';
    noResultsMessage.style.display = 'none';
    noResultsMessage.style.textAlign = 'center';
    noResultsMessage.style.padding = '2rem';
    noResultsMessage.style.marginBottom = '1.5rem';

    // Add both elements to container
    container.appendChild(searchBar);
    container.appendChild(noResultsMessage);

    // Add search functionality immediately
    searchBar.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const postCards = container.querySelectorAll('.blog-post');
        let foundResults = false;

        postCards.forEach(card => {
            // Skip the loading message and search bar itself
            if (card.querySelector('.blog-post-title')) {
                const title = card.querySelector('.blog-post-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = 'block';
                    foundResults = true;
                } else {
                    card.style.display = 'none';
                }
            }
        });

        // Show/hide no results message
        if (searchTerm.trim() !== '') {
            noResultsMessage.style.display = foundResults ? 'none' : 'block';
        } else {
            noResultsMessage.style.display = 'none';
        }
    });

    // Use event delegation for all post actions
    container.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            await handleDeletePost(event);
        } else if (event.target.classList.contains('edit-btn')) {
            await handleEditPost(event);
        } else if (event.target.classList.contains('save-btn')) {
            await handleSaveEdit(event);
        } else if (event.target.classList.contains('cancel-edit-btn')) {
            await cancelEdit(event);
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
                // Hide search bar when no posts
                searchBar.style.display = 'none';
                noResultsMessage.style.display = 'none';
                return;
            }

            // Show search bar when posts exist
            container.appendChild(searchBar);
            container.appendChild(noResultsMessage);
            searchBar.style.display = 'block';

            // Create a fragment to improve performance
            const fragment = document.createDocumentFragment();

            mine.forEach(post => {
                const card = document.createElement('div');
                card.className = 'blog-post';
                card.dataset.postId = post.id; // Store post ID on the card

                card.innerHTML = `
                    <div class="blog-post-header">
                        <div>
                            <h2 class="blog-post-title">${post.title}</h2>
                            <div class="blog-post-meta">
                                Posted ${new Date(post.created_at || post.updated_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="blog-post-content">
                        ${post.content}
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
        const csrfToken = await getCsrfToken();

        try {
            console.log('Sending DELETE request to /posts/' + postId);

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

    // New edit functionality
    async function handleEditPost(event) {
        const postId = event.target.dataset.id;
        console.log('Editing post:', postId);

        // Find the parent blog post card
        const postCard = event.target.closest('.blog-post');
        if (!postCard) return;

        // Get current title and content
        const titleElement = postCard.querySelector('.blog-post-title');
        const contentElement = postCard.querySelector('.blog-post-content');

        const originalTitle = titleElement.textContent;
        const originalContent = contentElement.innerHTML;

        // Replace the content with edit form
        postCard.innerHTML = `
            <div class="edit-form">
                <input type="text" class="edit-title-input" value="${originalTitle}" placeholder="Post Title">
                <textarea class="edit-content-input" placeholder="Write your post content here...">${originalContent}</textarea>
                <div class="edit-actions">
                    <button class="post-btn save-btn" data-id="${postId}">Save</button>
                    <button class="post-btn cancel-edit-btn" data-id="${postId}">Cancel</button>
                </div>
            </div>
        `;
    }

    // Save edited post
    async function handleSaveEdit(event) {
        const postId = event.target.dataset.id;
        console.log('Saving edited post:', postId);

        // Find the parent edit form
        const editForm = event.target.closest('.edit-form');
        if (!editForm) return;

        const titleInput = editForm.querySelector('.edit-title-input');
        const contentInput = editForm.querySelector('.edit-content-input');

        const newTitle = titleInput.value.trim();
        const newContent = contentInput.value.trim();

        // Validate inputs
        if (!newTitle || newTitle.length > 200) {
            alert('Title must be between 1 and 200 characters');
            return;
        }

        if (!newContent || newContent.length > 1000) {
            alert('Content must be between 1 and 1000 characters');
            return;
        }

        const csrfToken = await getCsrfToken();

        try {
            console.log('Sending PUT request to /posts/' + postId);

            const res = await fetch(`/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: newTitle,
                    content: newContent
                })
            });

            console.log('Update response status:', res.status);
            const responseText = await res.text();
            console.log('Update response text:', responseText);

            if (res.ok) {
                console.log('Post updated successfully');
                // Reload posts to show updated content
                await loadPosts();
                alert('Post updated successfully!');
            } else {
                console.error('Update failed with status:', res.status, 'Response:', responseText);
                throw new Error(`Failed to update post: ${res.status} - ${responseText}`);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post. Please try again.\n' + error.message);
        }
    }

    // Cancel edit
    async function cancelEdit(event) {
        console.log('Canceling edit');
        // Simply reload posts to restore original content
        await loadPosts();
    }

    await loadPosts();
})();
