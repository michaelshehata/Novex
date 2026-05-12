async function getCsrfToken() {

    const response = await fetch('/auth/csrf-token', {
        credentials: 'include'
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    return data.csrfToken;
}



function showMessage(el, text, isError = false) {

    if (!el) return;

    el.textContent = text;

    el.style.display = text ? 'block' : 'none';

    el.style.color = isError ? '#ff6b6b' : '#7ee787';
}



async function initMfaPanel() {

    const statusEl =
        document.getElementById('mfa_status');

    const msgEl =
        document.getElementById('mfa_message');

    const startBtn =
        document.getElementById('mfa_start_setup');

    const enablePanel =
        document.getElementById('mfa_enable_panel');

    const disablePanel =
        document.getElementById('mfa_disable_panel');

    const qrImage =
        document.getElementById('mfa_qr');

    const secretEl =
        document.getElementById('mfa_secret');

    const confirmInput =
        document.getElementById('mfa_confirm_code');

    const confirmBtn =
        document.getElementById('mfa_confirm_btn');

    const cancelBtn =
        document.getElementById('mfa_cancel_setup');

    const disablePwd =
        document.getElementById('mfa_disable_password');

    const disableBtn =
        document.getElementById('mfa_disable_btn');


    if (!statusEl || !startBtn) {
        return;
    }


    let session;

    try {

        const response =
            await fetch('/api/session', {
                credentials: 'include'
            });

        if (!response.ok) {

            showMessage(
                statusEl,
                'Unable to load account state.',
                true
            );

            return;
        }

        session = await response.json();

    }

    catch (err) {

        console.error(err);

        showMessage(
            statusEl,
            'Network error.',
            true
        );

        return;
    }


    if (!session.loggedIn) {

        showMessage(
            statusEl,
            'You must be logged in.',
            true
        );

        return;
    }


    function applyTotpState(enabled) {

        showMessage(msgEl, '');

        if (enabled === true) {

            statusEl.textContent =
                'Two-factor auth is ENABLED on your account.';

            startBtn.hidden = true;

            enablePanel.hidden = true;

            disablePanel.hidden = false;
        }

        else {

            statusEl.textContent =
                'Two-factor auth is DISABLED on your account.';

            startBtn.hidden = false;

            enablePanel.hidden = true;

            disablePanel.hidden = true;
        }
    }


    applyTotpState(
        session.totpEnabled === true
    );



    // START MFA SETUP
    startBtn.addEventListener('click', async () => {

        showMessage(msgEl, '');

        const csrfToken =
            await getCsrfToken();

        if (!csrfToken) {

            showMessage(
                msgEl,
                'Could not load CSRF token.',
                true
            );

            return;
        }

        try {

            const response =
                await fetch('/auth/mfa/setup', {

                    method: 'POST',

                    credentials: 'include',

                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },

                    body: JSON.stringify({
                        _csrf: csrfToken
                    })
                });

            if (!response.ok) {

                const text =
                    await response.text();

                showMessage(
                    msgEl,
                    text || 'Could not start MFA setup.',
                    true
                );

                return;
            }

            const data =
                await response.json();

            enablePanel.hidden = false;

            startBtn.hidden = true;

            disablePanel.hidden = true;

            if (qrImage && data.qrCode) {

                qrImage.src = data.qrCode;

                qrImage.hidden = false;
            }

            secretEl.textContent =
                data.secret_base32 || '';

        }

        catch (err) {

            console.error(err);

            showMessage(
                msgEl,
                'Network error.',
                true
            );
        }
    });



    // CONFIRM MFA
    confirmBtn?.addEventListener('click', async () => {

        const code =
            (confirmInput.value || '').trim();

        if (!/^\d{6}$/.test(code)) {

            showMessage(
                msgEl,
                'Enter a valid 6 digit code.',
                true
            );

            return;
        }

        const csrfToken =
            await getCsrfToken();

        if (!csrfToken) {

            showMessage(
                msgEl,
                'Could not load CSRF token.',
                true
            );

            return;
        }

        try {

            const response =
                await fetch('/auth/mfa/confirm', {

                    method: 'POST',

                    credentials: 'include',

                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },

                    body: JSON.stringify({
                        totpCode: code,
                        _csrf: csrfToken
                    })
                });

            if (!response.ok) {

                const text =
                    await response.text();

                showMessage(
                    msgEl,
                    text || 'Invalid MFA code.',
                    true
                );

                return;
            }

            applyTotpState(true);

            enablePanel.hidden = true;

            showMessage(
                msgEl,
                'Two-factor auth enabled successfully.'
            );

        }

        catch (err) {

            console.error(err);

            showMessage(
                msgEl,
                'Network error.',
                true
            );
        }
    });



    // CANCEL SETUP
    cancelBtn?.addEventListener('click', () => {

        enablePanel.hidden = true;

        startBtn.hidden = false;

        showMessage(msgEl, '');

        if (qrImage) {

            qrImage.hidden = true;

            qrImage.src = '';
        }
    });



    // DISABLE MFA
    disableBtn?.addEventListener('click', async () => {

        const password =
            disablePwd.value || '';

        if (!password) {

            showMessage(
                msgEl,
                'Password required.',
                true
            );

            return;
        }

        const csrfToken =
            await getCsrfToken();

        if (!csrfToken) {

            showMessage(
                msgEl,
                'Could not load CSRF token.',
                true
            );

            return;
        }

        try {

            const response =
                await fetch('/auth/mfa/disable', {

                    method: 'POST',

                    credentials: 'include',

                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },

                    body: JSON.stringify({
                        password,
                        _csrf: csrfToken
                    })
                });

            if (!response.ok) {

                const text =
                    await response.text();

                showMessage(
                    msgEl,
                    text || 'Could not disable MFA.',
                    true
                );

                return;
            }

            disablePwd.value = '';

            applyTotpState(false);

            showMessage(
                msgEl,
                'Two-factor auth disabled.'
            );

        }

        catch (err) {

            console.error(err);

            showMessage(
                msgEl,
                'Network error.',
                true
            );
        }
    });
}



initMfaPanel();