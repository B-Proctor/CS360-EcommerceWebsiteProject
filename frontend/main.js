document.addEventListener("DOMContentLoaded", () => {
    const products = [
        { id: 1, name: "Laptop", price: 999.99, image: "assets/laptop.avif" },
        { id: 2, name: "Headphones", price: 49.99, image: "assets/headphones.jpg" },
        { id: 3, name: "Smartphone", price: 699.99, image: "assets/smartphone.jpg" },
        { id: 4, name: "Smartwatch", price: 199.99, image: "assets/smartwatch.jpg" },
        { id: 5, name: "Camera", price: 549.99, image: "assets/camera.jpg" },
        { id: 6, name: "Mouse", price: 19.99, image: "assets/mouse.jpg" }
    ];

    const productsDiv = document.getElementById("products");

    // Display products
    products.forEach(product => {
        const div = document.createElement("div");
        div.classList.add("product");
        div.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>$${product.price}</p>
            <button onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image}')">Add to Cart</button>
        `;
        productsDiv.appendChild(div);
    });

    updateCartCount();
});

function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartLink = document.getElementById("cart-link");
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartLink.textContent = `View Cart (${itemCount})`;
}
