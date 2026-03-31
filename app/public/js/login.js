// Client side check only, server uses the same response for failed login .

document.getElementById('login_form')?.addEventListener('submit', function (e) {
    const username = document.getElementById('username_input').value.trim();
    const password = document.getElementById('password_input').value;

    if (!username || !password) {
        e.preventDefault();
        let el = document.getElementById('login_error');
        if (el) el.remove();
        el = document.createElement('p');
        el.id = 'login_error';
        el.textContent = 'Please fill out the login fields.';
        el.classList.add('error');
        document.querySelector('#login_btn').parentNode.insertBefore(el, document.querySelector('#login_btn'));
    }
});
