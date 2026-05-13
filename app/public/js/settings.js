(async () => {
    const session = await protectPage();
    if (!session) return;

    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const mfa = document.getElementById('mfa_status');

    if (username) {
        username.textContent = session.username;
    }

    if (email) {
        email.textContent = session.email || 'Hidden';
    }

    if (mfa) {
        mfa.textContent = session.totpEnabled ? 'Enabled' : 'Disabled';
    }

    // Password editing logic
    const changePasswordBtn = document.getElementById('change_password_btn');
    const currentPasswordInput = document.getElementById('current_password');
    const newPasswordInput = document.getElementById('new_password');
    const confirmNewPasswordInput = document.getElementById('confirm_new_password');
    const mfaCodeField = document.getElementById('mfa_code_field');
    const mfaCodeInput = document.getElementById('mfa_code');
    const messageDiv = document.getElementById('password_message');

    // Get CSRF token dynamically like in main.js
    let csrfToken = '';

    try {
        const csrfRes = await fetch('/auth/csrf-token', { credentials: 'include' });
        if (csrfRes.ok) {
            const csrfData = await csrfRes.json();
            csrfToken = csrfData.csrfToken;
        }
    } catch (err) {
        console.error('Failed to get CSRF token:', err);
    }

    changePasswordBtn.addEventListener('click', async () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;
        const mfaCode = mfaCodeInput.value;

        if (newPassword !== confirmNewPassword) {
            showMessage("New passwords do not match.", "error");
            return;
        }

        if (newPassword.length < 8) {
            showMessage("New password must be at least 8 characters long.", "error");
            return;
        }

        // Validate CSRF token exists
        if (!csrfToken) {
            showMessage("CSRF token not available. Please refresh the page.", "error");
            return;
        }

        const payload = {
            currentPassword,
            newPassword
        };

        if (session.totpEnabled) {
            if (!mfaCode) {
                showMessage("MFA code is required.", "error");
                return;
            }
            payload.mfaCode = mfaCode;
        }

        try {
            console.log('Sending request to /api/update-password with data:', payload);

            const response = await fetch('/api/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            console.log('Response status:', response.status);

            const result = await response.json();
            console.log('Response data:', result);

            if (response.ok) {
                showMessage("Password updated successfully.", "success");
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmNewPasswordInput.value = '';
                mfaCodeInput.value = '';
            } else {
                showMessage(result.message || "Failed to update password.", "error");
            }
        } catch (err) {
            console.error('Full error details:', err);
            showMessage("Network error occurred. Please try again.", "error");
        }
    });

    // Show MFA field if needed
    if (session.totpEnabled) {
        mfaCodeField.style.display = 'block';
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `muted ${type}`;
    }
})();
