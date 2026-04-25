async function displayUsername() {
    try {
        const response = await fetch('/api/session');
        if (!response.ok) return;

        const data = await response.json();
        const link = document.querySelector('#login_link');
        if (!link) return;
        link.textContent = data.loggedIn && data.username ? data.username : 'Guest';
    } catch (err) {
        console.error('Failed to load session state:', err);
    }
}


async function getCsrfToken() {
    try {
        const response = await fetch('/auth/csrf-token');
        if (!response.ok) return null;

        const data = await response.json();
        return data.csrfToken;
    } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        return null;
    }
}


function setupLogout() {
    const logoutButton = document.querySelector('#logout_btn');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                console.error('Logout blocked because the CSRF token could not be loaded.');
                return;
            }

            const headers = { 'x-csrf-token': csrfToken };
            const response = await fetch('/logout', { method: 'POST', headers });
            if (response.ok) {
                window.location.href = '/html/login.html';
            } else {
                console.error('Logout failed:', response.status);
            }
        } catch (err) {
            console.error('Logout error:', err);
        }
    });
}


displayUsername();
setupLogout();