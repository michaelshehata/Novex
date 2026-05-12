async function loadLatestPosts() {

    try {

        const response = await fetch('/posts');

        const posts = await response.json();

        const container =
            document.getElementById('latest_posts');

        container.innerHTML = '';

        posts.slice(0, 3).forEach(post => {

            const postCard =
                document.createElement('div');

            postCard.className =
                'card post-card';

            postCard.innerHTML = `

        <h3>${post.title}</h3>

        <p class="muted">
          ${post.content.substring(0, 120)}...
        </p>

      `;

            container.appendChild(postCard);
        });

    } catch (err) {

        console.error(err);
    }
}

loadLatestPosts();