async function getSession() {
    try {
        const res = await fetch('/api/session', {
            credentials: 'include'
        });

        return await res.json();

    } catch {
        return {
            loggedIn: false
        };
    }
}

async function logout() {
    try {
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });

    } catch (err) {
        console.error(err);
    }

    window.location.href = '/';
}

async function protectPage() {
    const session = await getSession();

    if (!session.loggedIn) {
        window.location.href = '/login';
        return null;
    }

    return session;
}

async function updateNavbar() {
    const navAuth =
        document.getElementById('nav_auth');

    if (!navAuth) return;

    const session = await getSession();

    if (session.loggedIn) {
        navAuth.innerHTML = `
            <a href="/dashboard">Dashboard</a>
            <a href="/posts-page">Posts</a>
            <a href="/create_post">Create Post</a>
            <a href="/my_posts">My Posts</a>
            <a href="/settings">Settings</a>
            <button id="logout_btn">Logout</button>
        `;

        const logoutBtn =
            document.getElementById('logout_btn');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

    } else {
        navAuth.innerHTML = `
            <a href="/login">Login</a>
            <a href="/register">Register</a>
        `;
    }
}

updateNavbar();