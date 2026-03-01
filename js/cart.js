// ==========================
// CART (ForceLab) - CLEAN
// ==========================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ==========================
   HELPERS
========================== */
function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
      type: item?.type || "product",
      id: item?.id ?? null,
    }))
    .filter((item) => item.qty > 0);

  saveCart();
}

function escapeForInlineJs(str) {
  return String(str ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/* ==========================
   ADD TO CART (1 unidade)
========================== */
function addToCart(name, price, image) {
  addToCartQty(name, price, image, 1);
}

/* ==========================
   ADD TO CART (COM QTY)
   - compatível com produto antigo
   - suporta kit com (type, id)
========================== */
function addToCartQty(name, price, image, qty = 1, meta = {}) {
  normalizeCart();

  const n = String(name || "Produto");
  const p = Number(price) || 0;
  const q = Math.max(1, Number(qty) || 1);
  const img = image || "https://via.placeholder.com/80";

  const type = meta.type || "product";
  const id = meta.id || null;

  const existing = cart.find((item) => {
    if (id && item.id) return item.type === type && item.id === id;
    return item.name === n; // legado
  });

  if (existing) {
    existing.qty += q;

    if (img && img !== "https://via.placeholder.com/80") existing.image = img;
    existing.price = p;

    if (id) {
      existing.type = type;
      existing.id = id;
    }
  } else {
    cart.push({
      type,
      id,
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
   - novo: removeItem(type, id)
   - antigo: removeItem(name)
========================== */
function removeItem(nameOrType, maybeId) {
  normalizeCart();

  // Remoção por chave (type,id)
  if (typeof maybeId === "string" && maybeId.length) {
    const type = nameOrType || "product";
    const id = maybeId;

    cart = cart.filter((item) => !(item.type === type && item.id === id));
    saveCart();
    updateCart();
    return;
  }

  // Legado: remove por nome
  const name = String(nameOrType || "");
  cart = cart.filter((item) => item.name !== name);
  saveCart();
  updateCart();
}

/* ==========================
   CHANGE QUANTITY (legado por nome)
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

  // COUNT
  const count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.innerText = count;

  // MINI CART
  const miniItems = document.getElementById("miniCartItems");
  const miniTotal = document.getElementById("miniTotal");

  if (miniItems && miniTotal) {
    miniItems.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
      total += item.price * item.qty;
      const safeName = escapeForInlineJs(item.name);

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

  // CART PAGE
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (cartItems && cartTotal) {
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
      total += item.price * item.qty;
      const safeName = escapeForInlineJs(item.name);

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
    });

    cartTotal.innerText = brl(total);
  }

  // ✅ dispara UMA vez, ao final
  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: { cart },
    })
  );
}

/* ==========================
   TOGGLE CART SIDEBAR
========================== */
function toggleCart(force) {
  const drawer = document.getElementById("miniCart");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer) return;

  const shouldOpen =
    typeof force === "boolean" ? force : !drawer.classList.contains("open");

  drawer.classList.toggle("open", shouldOpen);
  drawer.setAttribute("aria-hidden", shouldOpen ? "false" : "true");

  if (overlay) {
    overlay.classList.toggle("open", shouldOpen);
    overlay.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  }

  document.body.classList.toggle("no-scroll", shouldOpen);
}

window.toggleCart = toggleCart;

/* ==========================
   BIND CART DRAWER
========================== */
function bindCartDrawer() {
  const btn = document.querySelector(".cart-ico-btn");
  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleCart(true);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-close="cart"]')) toggleCart(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleCart(false);
  });
}

/* ==========================
   EXPORT GLOBALS (1x)
========================== */
window.addToCart = addToCart;
window.addToCartQty = addToCartQty;
window.removeItem = removeItem;
window.changeQty = changeQty;
window.toggleCart = toggleCart;

/* ==========================
   INIT
========================== */
document.addEventListener("DOMContentLoaded", () => {
  updateCart();
  bindCartDrawer();
});