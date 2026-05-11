const postsContainer =
    document.getElementById('posts_container');

async function loadPosts() {
    try {
        const res =
            await fetch('/posts');

        const posts =
            await res.json();

        postsContainer.innerHTML = '';

        posts.forEach(post => {

            const card =
                document.createElement('div');

            card.className = 'post-card';

            card.innerHTML = `
                <h2>${post.title}</h2>
                <p>${post.content}</p>
            `;

            postsContainer.appendChild(card);
        });

    } catch (err) {
        console.error(err);

        postsContainer.innerHTML =
            '<p>Could not load posts.</p>';
    }
}

loadPosts();