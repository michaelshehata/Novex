async function displayUsername() {
    const response = await fetch('/api/session');
    const data = await response.json();
    const link = document.querySelector('#login_link');
    if (!link) return;
    link.textContent = data.loggedIn && data.username ? data.username : 'Guest';
}

displayUsername();