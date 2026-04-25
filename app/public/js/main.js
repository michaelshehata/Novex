async function displayUsername() {
    const response = await fetch('/api/session');
    const data = await response.json();
    const link = document.querySelector('#login_link');
    if (!link) return;
    link.textContent = data.loggedIn && data.username ? data.username : 'Guest';
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
            const headers = csrfToken ? { 'x-csrf-token': csrfToken } : {};
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