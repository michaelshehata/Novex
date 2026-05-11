async function getCsrfToken() {

    const res =
        await fetch('/auth/csrf-token', {
            credentials: 'include'
        });

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



if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        try {

            const csrfToken =
                await getCsrfToken();

            const title =
                document.getElementById('post_title').value;

            const category =
                document.getElementById('post_category').value;

            const content =
                document.getElementById('post_content').value;

            const res =
                await fetch('/posts', {

                    method: 'POST',

                    credentials: 'include',

                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },

                    body: JSON.stringify({
                        title,
                        category,
                        content,
                        _csrf: csrfToken
                    })
                });

            if (res.ok) {

                window.location.href =
                    '/posts-page';

                return;
            }

            const text =
                await res.text();

            alert(text || 'Unable to create post');

        }

        catch (err) {

            console.error(err);

            alert('Network error.');
        }
    });
}