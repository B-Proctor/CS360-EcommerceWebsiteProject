async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });

    const message = await response.text();
    alert(message);

    if (response.ok) {
        window.location.href = '/';
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, email, password })
    });

    const message = await response.text();
    alert(message);

    if (response.ok) {
        window.location.href = '/login';
    }
}

async function checkLoginStatus() {
    const response = await fetch('/dashboard', {
        credentials: 'include'
    });

    const nav = document.getElementById('nav-bar');

    if (response.ok) {
        nav.innerHTML = `
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/cart">Cart</a>
            <div class="dropdown">
                <a href="/profile">Profile ▼</a>
                <div class="dropdown-content">
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            </div>
        `;
    } else {
        nav.innerHTML = `
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/cart">Cart</a>
            <a href="/login">Login</a>
            <a href="/register">Register</a>
        `;
    }
}

async function logout() {
    await fetch('/logout', { credentials: 'include' });
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);
