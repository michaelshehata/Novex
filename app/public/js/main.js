async function displayUsername() {
    const response = await fetch('/api/session');
    const data = await response.json();
    const link = document.querySelector('#login_link');
    if (!link) return;
    link.textContent = data.loggedIn && data.username ? data.username : 'Guest';
}


function setupLogout() {
    const logoutButton = document.querySelector('#logout_btn');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/logout', { method: 'POST' });
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