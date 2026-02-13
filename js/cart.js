let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ==========================
   ADD TO CART
========================== */
function addToCart(name, price, image) {
  price = Number(price);

  if (!image) {
    image = "https://via.placeholder.com/80";
  }

  let existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      name,
      price,
      image,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

/* ==========================
   REMOVE ITEM
========================== */
function removeItem(name) {
  cart = cart.filter(item => item.name !== name);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

/* ==========================
   CHANGE QUANTITY
========================== */
function changeQty(name, action) {
  cart.forEach(item => {
    if (item.name === name) {
      if (action === "plus") item.qty++;
      if (action === "minus" && item.qty > 1) item.qty--;
    }
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

/* ==========================
   UPDATE CART UI
========================== */
function updateCart() {

  /* CART COUNT */
  let count = cart.reduce((sum, item) => sum + item.qty, 0);
  let cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.innerText = count;

  /* MINI CART */
  let miniItems = document.getElementById("miniCartItems");
  let miniTotal = document.getElementById("miniTotal");

  if (miniItems && miniTotal) {
    miniItems.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      total += item.price * item.qty;

      miniItems.innerHTML += `
        <div class="mini-item">
          <img src="${item.image}">
          <div>
            <p>${item.name}</p>
            <small>R$ ${item.price} x ${item.qty}</small>
          </div>
          <button onclick="removeItem('${item.name}')">✖</button>
        </div>
      `;
    });

    miniTotal.innerText = total.toFixed(2);
  }

  /* CART PAGE */
  let cartItems = document.getElementById("cartItems");
  let cartTotal = document.getElementById("cartTotal");

  if (cartItems && cartTotal) {
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      total += item.price * item.qty;

      cartItems.innerHTML += `
        <div class="cart-row">
          <img src="${item.image}">
          
          <div class="cart-info">
            <h3>${item.name}</h3>
            <p>R$ ${item.price}</p>
          </div>

          <div class="cart-qty">
            <button onclick="changeQty('${item.name}','minus')">-</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${item.name}','plus')">+</button>
          </div>

          <div class="cart-sub">
            <strong>R$ ${(item.price * item.qty).toFixed(2)}</strong>
          </div>

          <button class="remove" onclick="removeItem('${item.name}')">✖</button>
        </div>
      `;
    });

    cartTotal.innerText = total.toFixed(2);
  }
}

/* ==========================
   TOGGLE CART SIDEBAR
========================== */
function toggleCart() {
  document.getElementById("miniCart").classList.toggle("active");
}

updateCart();
