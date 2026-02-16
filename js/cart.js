let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ==========================
   HELPERS
========================== */
function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function normalizeCart() {
  cart = (cart || [])
    .map((item) => ({
      ...item,
      price: Number(item?.price) || 0,
      qty: Math.max(1, Number(item?.qty) || 1),
      name: String(item?.name || "Produto"),
      image: item?.image || "https://via.placeholder.com/80",
    }))
    .filter((item) => item.qty > 0);

  saveCart();
}

/* ==========================
   ADD TO CART (1 unidade)
========================== */
function addToCart(name, price, image) {
  addToCartQty(name, price, image, 1);
}

/* ==========================
   ADD TO CART (COM QTY) ✅
========================== */
function addToCartQty(name, price, image, qty = 1) {
  normalizeCart();

  const n = String(name || "Produto");
  const p = Number(price) || 0;
  const q = Math.max(1, Number(qty) || 1);
  const img = image || "https://via.placeholder.com/80";

  let existing = cart.find((item) => item.name === n);

  if (existing) {
    existing.qty += q;
    // Se o item já existe mas veio uma imagem melhor, atualiza
    if (img && img !== "https://via.placeholder.com/80") existing.image = img;
    // Se o preço mudou, atualiza também (opcional)
    existing.price = p;
  } else {
    cart.push({
      name: n,
      price: p,
      image: img,
      qty: q,
    });
  }

  saveCart();
  updateCart();
}

/* ==========================
   REMOVE ITEM
========================== */
function removeItem(name) {
  normalizeCart();
  cart = cart.filter((item) => item.name !== name);
  saveCart();
  updateCart();
}

/* ==========================
   CHANGE QUANTITY
========================== */
function changeQty(name, action) {
  normalizeCart();

  cart.forEach((item) => {
    if (item.name === name) {
      if (action === "plus") item.qty++;
      if (action === "minus") item.qty = Math.max(1, item.qty - 1);
    }
  });

  saveCart();
  updateCart();
}

/* ==========================
   UPDATE CART UI
========================== */
function updateCart() {
  normalizeCart();

  /* CART COUNT */
  const count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.innerText = count;

  /* MINI CART */
  const miniItems = document.getElementById("miniCartItems");
  const miniTotal = document.getElementById("miniTotal");

  if (miniItems && miniTotal) {
    miniItems.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
      total += item.price * item.qty;
      const safeName = String(item.name).replace(/'/g, "\\'");

      miniItems.innerHTML += `
        <div class="mini-item">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <p>${item.name}</p>
            <small>${brl(item.price)} x ${item.qty}</small>
          </div>
          <button onclick="removeItem('${safeName}')" aria-label="Remover">✖</button>
        </div>
      `;
    });

    miniTotal.innerText = brl(total);
  }

  /* CART PAGE */
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (cartItems && cartTotal) {
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
      total += item.price * item.qty;
      const safeName = String(item.name).replace(/'/g, "\\'");

      cartItems.innerHTML += `
        <div class="cart-row">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-info">
            <h3>${item.name}</h3>
            <p>${brl(item.price)}</p>
          </div>

          <div class="cart-qty">
            <button onclick="changeQty('${safeName}','minus')" aria-label="Diminuir">-</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${safeName}','plus')" aria-label="Aumentar">+</button>
          </div>

          <div class="cart-sub">
            <strong>${brl(item.price * item.qty)}</strong>
          </div>

          <button class="remove" onclick="removeItem('${safeName}')" aria-label="Remover">✖</button>
        </div>
      `;
      // ... no FINAL do updateCart()
window.dispatchEvent(new CustomEvent("cartUpdated", {
  detail: { cart }
}));

    });

    cartTotal.innerText = brl(total);
  }

  // ✅ dispara UMA vez, depois de atualizar tudo
  window.dispatchEvent(new Event("cartUpdated"));
}


/* ==========================
   TOGGLE CART SIDEBAR
========================== */
function toggleCart() {
  const el = document.getElementById("miniCart");
  if (el) el.classList.toggle("active");
}

/* INIT */
updateCart();

/* GLOBAIS */
window.addToCart = addToCart;
window.addToCartQty = addToCartQty;
window.removeItem = removeItem;
window.changeQty = changeQty;
window.toggleCart = toggleCart;
