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
   - compatível com produto antigo
   - suporta kit com (type, id)
========================== */
function addToCartQty(name, price, image, qty = 1, meta = {}) {
  normalizeCart();

  const n = String(name || "Produto");
  const p = Number(price) || 0;
  const q = Math.max(1, Number(qty) || 1);
  const img = image || "https://via.placeholder.com/80";

  // NOVO: suporta tipo e id (kit/produto)
  const type = meta.type || "product";
  const id = meta.id || null;

  // Chave de comparação:
  // 1) se tiver type+id -> usa isso (melhor)
  // 2) senão mantém o legado: usa name
  let existing = cart.find((item) => {
    if (id && item.id) return item.type === type && item.id === id;
    return item.name === n;
  });

  if (existing) {
    existing.qty += q;

    // atualiza imagem se vier melhor
    if (img && img !== "https://via.placeholder.com/80") existing.image = img;

    // atualiza preço (opcional)
    existing.price = p;

    // garante type/id se veio agora
    if (id) {
      existing.type = type;
      existing.id = id;
    }
  } else {
    cart.push({
      type,
      id,          // pode ser null em itens antigos
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
   - novo: removeItemKey(type, id)
   - antigo: removeItem(name) ainda funciona
========================== */
function removeItem(nameOrType, maybeId) {
  normalizeCart();

  // Se veio (type, id): remove por chave
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

/* Helper opcional (se você quiser chamar direto) */
function removeItemKey(type, id) {
  return removeItem(type, id);
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

// ==========================
// EXPORTA FUNÇÕES PRO WINDOW
// (necessário pq kit-detail.js é module)
// ==========================
window.addToCartQty = addToCartQty;
window.addToCart = addToCart;
window.removeItem = removeItem;

