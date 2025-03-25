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
        const user = await response.json();

        nav.innerHTML = `
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/cart">Cart</a>
            <div class="dropdown">
                <a href="/profile">${user.firstName} ${user.lastName} ▼</a>
                <div class="dropdown-content">
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
        const message = await response.text();
        alert(`Logout failed: ${message}`);
    }
}

async function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const response = await fetch(`/products`);
    const products = await response.json();
    const product = products.find(p => p.id === item.id);

    if (product) {
        const existingItem = cart.find(i => i.id === item.id);

        if (existingItem) {
            if (existingItem.quantity < product.quantity) {
                existingItem.quantity += 1;
            } else {
                alert(`Only ${product.quantity} in stock.`);
                return;
            }
        } else {
            if (item.quantity <= product.quantity) {
                cart.push(item);
            } else {
                alert(`Only ${product.quantity} in stock.`);
                return;
            }
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        console.log("Item added to cart:", cart);
        loadCart();
    } else {
        alert('Product no longer available.');
    }
}



document.addEventListener('DOMContentLoaded', checkLoginStatus);
