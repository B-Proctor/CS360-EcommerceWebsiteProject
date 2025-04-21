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

    // If all checks passed, show modal
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
        alert('Invalid credit card number.');
        return false;
    }

    if (!cardName || !expiry || !cvv) {
        alert('Please fill in all fields.');
        return false;
    }

    // Expiration format and range check
    const [expMonth, expYear] = expiry.split('/');
    if (!expMonth || !expYear || expMonth < 1 || expMonth > 12) {
        alert('Invalid expiry date format. Use MM/YY.');
        return false;
    }

    const now = new Date();
    const currentYear = parseInt(now.getFullYear().toString().slice(-2)); // YY
    const currentMonth = now.getMonth() + 1; // 0-indexed

    const expMonthNum = parseInt(expMonth);
    const expYearNum = parseInt(expYear);

    if (isNaN(expMonthNum) || isNaN(expYearNum)) {
        alert('Invalid expiry date.');
        return false;
    }

    if (
        expYearNum < currentYear ||
        (expYearNum === currentYear && expMonthNum < currentMonth)
    ) {
        alert('Your card has expired.');
        return false;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

        const modal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
        modal.hide();
    } else {
        alert('Checkout failed.');
    }

    return true;
}


//Credit card number check I found online
/*Numbers that work:
* 4111 1111 1111 1111 Visa
* 6011 1111 1111 1117 Discover
* 5500 0000 0000 0004 Mastercard
*/
function luhnCheck(cardNum) {
    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNum.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNum[i]);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}
