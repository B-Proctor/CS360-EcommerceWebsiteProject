document.addEventListener('DOMContentLoaded', loadCart);

async function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartDiv = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");

    cartDiv.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartDiv.innerHTML = "<p class='text-center text-white'>Your cart is empty.</p>";
        totalPriceElement.innerText = "0.00";
        return;
    }

    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        total += item.price * item.quantity;

        const div = document.createElement("div");
        div.className = "col-md-4 d-flex align-items-stretch";
        div.innerHTML = `
      <div class="card text-center" style="background-color:#0C1618; border:1px solid #004643;">
        <img src="${item.image}" class="card-img-top" alt="${item.name}"
             style="height:200px;object-fit:contain;background-color:#004643;padding:8px;">
        <div class="card-body d-flex flex-column text-white">
          <h5 class="card-title">${item.name}</h5>
          <p class="text-success">$${parseFloat(item.price).toFixed(2)}</p>
          <input type="number" class="form-control mb-2" value="${item.quantity}" min="1"
                 onchange="updateQuantity(${i}, this.value)">
          <button class="btn btn-danger mt-auto" onclick="removeItem(${i})">Remove</button>
        </div>
      </div>
    `;
        cartDiv.appendChild(div);
    }

    totalPriceElement.innerText = total.toFixed(2);
}

async function updateQuantity(index, quantity) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart[index];
    const res = await fetch('/api/products', { credentials: 'include' });
    const products = await res.json();
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
        alert('Item not found.');
        cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

async function checkout() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("Cart is empty.");
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
}

async function handleFakePayment(event) {
    event.preventDefault();

    const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
    const cardName = document.getElementById('cardName').value.trim();
    const expiry = document.getElementById('expiry').value.trim();
    const cvv = document.getElementById('cvv').value.trim();

    if (!luhnCheck(cardNumber)) {
        alert('Invalid card number.');
        return;
    }

    if (!cardName || !expiry || !cvv) {
        alert('Fill all fields.');
        return;
    }

    const [expMonth, expYear] = expiry.split('/');
    const now = new Date();
    if (
        parseInt(expYear) < parseInt(now.getFullYear().toString().slice(-2)) ||
        (parseInt(expYear) === parseInt(now.getFullYear().toString().slice(-2)) &&
            parseInt(expMonth) < now.getMonth() + 1)
    ) {
        alert('Card expired.');
        return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cart })
    });

    if (res.ok) {
        alert('Checkout successful!');
        localStorage.removeItem("cart");
        loadCart();
        bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
        window.location.href = '/orders';
    } else {
        const error = await res.json();
        alert(error.error || 'Checkout failed.');
    }
}

function luhnCheck(cardNum) {
    let sum = 0, flip = false;
    for (let i = cardNum.length - 1; i >= 0; i--) {
        let n = parseInt(cardNum[i]);
        if (flip && (n *= 2) > 9) n -= 9;
        sum += n;
        flip = !flip;
    }
    return sum % 10 === 0;
}
