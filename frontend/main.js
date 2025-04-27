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
    const response = await fetch('/dashboard', { credentials: 'include' });
    const nav = document.getElementById('nav-bar');

    if (response.ok) {
        const user = await response.json();
        nav.innerHTML = `
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/cart">Cart</a>
            <div class="dropdown">
                <a class="dropbtn" href="#">${user.firstName} ${user.lastName} ▼</a>
                <div class="dropdown-content">
                    <a href="/orders">Orders</a>
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            </div>
        `;
        if (user.isAdmin) {
            nav.innerHTML += `<a href="/admin">Admin Panel</a>`;
        }
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
    const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.href = '/';
    } else {
        const msg = await response.text();
        alert(`Logout failed: ${msg}`);
    }
}

async function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const res = await fetch('/api/products', { credentials: 'include' });
    const products = await res.json();
    const product = products.find(p => p.id === item.id);

    if (!product) {
        alert('Product no longer available.');
        return;
    }

    let existing = cart.find(i => i.id === item.id);

    if (existing) {
        if (existing.quantity < product.quantity) {
            existing.quantity++;
        } else {
            alert(`Only ${product.quantity} in stock.`);
            return;
        }
    } else {
        cart.push(item);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("Cart:", cart);

    if (typeof loadCart === "function") {
        loadCart();  // Safe call if cart.js is loaded
    }
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);
