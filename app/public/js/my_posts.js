(async () => {

    const session =
        await protectPage();

    if (!session) return;

    const container =
        document.getElementById('my_posts_container');

    async function loadPosts() {

        const res =
            await fetch('/posts');

        const posts =
            await res.json();

        const mine =
            posts.filter(
                p => p.user_id === session.userId
            );

        container.innerHTML = '';

        mine.forEach(post => {

            const card =
                document.createElement('div');

            card.className = 'post-card';

            card.innerHTML = `
                <h2>${post.title}</h2>
                <p>${post.content}</p>

                <button data-id="${post.id}">
                    Delete
                </button>
            `;

            container.appendChild(card);
        });
    }

    await loadPosts();

})();