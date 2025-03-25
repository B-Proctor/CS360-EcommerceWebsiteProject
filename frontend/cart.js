document.addEventListener("DOMContentLoaded", loadCart);

function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartDiv = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");

    cartDiv.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartDiv.innerHTML = "<p class='text-center'>Your cart is empty.</p>";
        totalPriceElement.innerText = "0.00";
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        let div = document.createElement("div");
        div.classList.add("col-md-4");

        div.innerHTML = `
            <div class="card">
                <img src="${item.image}" class="card-img-top" alt="${item.name}">
                <div class="card-body text-center">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">$${item.price.toFixed(2)}</p>
                    <input type="number" class="form-control mb-2" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                    <button class="btn btn-danger" onclick="removeItem(${index})">Remove</button>
                </div>
            </div>
        `;

        cartDiv.appendChild(div);
    });

    totalPriceElement.innerText = total.toFixed(2);
}

async function updateQuantity(index, quantity) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart[index];

    const response = await fetch(`/products`);
    const products = await response.json();
    const product = products.find(p => p.id === item.id);

    if (product) {
        if (quantity > product.quantity) {
            alert(`Only ${product.quantity} in stock.`);
            cart[index].quantity = product.quantity;
        } else if (quantity < 1) {
            cart[index].quantity = 1;
        } else {
            cart[index].quantity = parseInt(quantity);
        }
    } else {
        alert('Item not found in stock.');
        cart.splice(index, 1); 
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}


function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart"));
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

async function checkout() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart is empty.");
        return;
    }

    const response = await fetch('/products');
    const products = await response.json();

    for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (!product || product.quantity < item.quantity) {
            alert(`Not enough stock available for ${item.name}.`);
            loadCart();
            return;
        }
    }

    const checkoutResponse = await fetch('/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart })
    });

    if (checkoutResponse.ok) {
        alert('Checkout complete!');
        localStorage.removeItem("cart");
        loadCart();
        loadProducts();
    } else {
        alert('Checkout failed.');
    }
}

