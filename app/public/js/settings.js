(async () => {

    const session =
        await protectPage();

    if (!session) return;

    const username =
        document.getElementById('username');

    const email =
        document.getElementById('email');

    const mfa =
        document.getElementById('mfa_status');

    if (username) {
        username.textContent =
            session.username;
    }

    if (email) {
        email.textContent =
            session.email || 'Hidden';
    }

    if (mfa) {
        mfa.textContent =
            session.totpEnabled
                ? 'Enabled'
                : 'Disabled';
    }

})();