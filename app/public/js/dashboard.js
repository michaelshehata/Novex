(async () => {
    const session =
        await protectPage();

    if (!session) return;

    const welcome =
        document.getElementById('welcome_user');

    if (welcome) {
        welcome.textContent =
            `Welcome back, ${session.username}`;
    }
})();