document.addEventListener("DOMContentLoaded", loadCart);

function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartDiv = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");

    cartDiv.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartDiv.innerHTML = "<p>Your cart is empty.</p>";
        totalPriceElement.innerText = "0.00";
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        let div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>Price: $${item.price}</p>
            <label>Quantity: </label>
            <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
            <button onclick="removeItem(${index})">Remove</button>
        `;
        cartDiv.appendChild(div);
    });

    totalPriceElement.innerText = total.toFixed(2);
}

function updateQuantity(index, quantity) {
    let cart = JSON.parse(localStorage.getItem("cart"));
    cart[index].quantity = parseInt(quantity);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart"));
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

function checkout() {
    alert("Proceeding to checkout...");
    localStorage.removeItem("cart");
    loadCart();
}
