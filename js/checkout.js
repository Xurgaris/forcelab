// js/checkout.js
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ========= Helpers =========
function brl(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeCart(raw) {
  const cart = Array.isArray(raw) ? raw : [];
  return cart
    .map((i) => ({
      name: String(i?.name || "Produto"),
      price: Number(i?.price) || 0,
      qty: Number(i?.qty) || 1,
      image: i?.image || "https://via.placeholder.com/80"
    }))
    .filter((i) => i.qty > 0);
}

// Lê o estado de cupom/frete que o pricing.js pode salvar
function getPricingState() {
  // Prioridade: sessionStorage (melhor UX), senão localStorage
  const s =
    sessionStorage.getItem("pricingState") ||
    localStorage.getItem("pricingState") ||
    "{}";

  try {
    const parsed = JSON.parse(s);
    return {
      couponCode: String(parsed.couponCode || ""),
      discount: Number(parsed.discount) || 0,     // valor em R$
      shipping: Number(parsed.shipping) || 0,     // valor em R$
      eta: String(parsed.eta || ""),              // texto tipo "Chega em 3-5 dias"
      cep: String(parsed.cep || "")
    };
  } catch {
    return { couponCode: "", discount: 0, shipping: 0, eta: "", cep: "" };
  }
}

function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

// ========= Main =========
const form = document.querySelector(".checkout-form");
const boxItems = document.getElementById("miniCartItems");
const boxTotal = document.getElementById("miniTotal");

function renderSummary() {
  const cart = normalizeCart(JSON.parse(localStorage.getItem("cart")) || []);
  if (boxItems) boxItems.innerHTML = "";

  let subtotal = 0;
  cart.forEach((i) => {
    subtotal += i.price * i.qty;
    if (boxItems) {
      boxItems.innerHTML += `
        <div class="mini-item">
          <img src="${i.image}" alt="${i.name}">
          <div>
            <p>${i.name}</p>
            <small>${brl(i.price)} x ${i.qty}</small>
          </div>
        </div>
      `;
    }
  });

  const pricing = getPricingState();
  const total = Math.max(0, subtotal - pricing.discount + pricing.shipping);

  if (boxTotal) boxTotal.textContent = brl(total);
}

renderSummary();

// Se o cart atualizar em outra aba/component, re-render
window.addEventListener("cartUpdated", renderSummary);

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cart = normalizeCart(JSON.parse(localStorage.getItem("cart")) || []);
  if (!cart.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  // Coleta dados do form (pelos names que você já usa)
  const fd = new FormData(form);
  const nome = String(fd.get("nome") || "").trim();
  const whatsapp = String(fd.get("whatsapp") || "").trim();
  const endereco = String(fd.get("endereco") || "").trim();
  const pagamento = String(fd.get("pagamento") || "Pix").trim();
  const obs = String(fd.get("obs") || "").trim();

  if (!nome || !whatsapp || !endereco) {
    alert("Preencha nome, WhatsApp e endereço.");
    return;
  }

  const pricing = getPricingState();

  const subtotal = calcSubtotal(cart);
  const discount = Math.min(Number(pricing.discount || 0), subtotal); // nunca maior que subtotal
  const shipping = Number(pricing.shipping || 0);
  const total = Math.max(0, subtotal - discount + shipping);

  // Monta pedido
  const order = {
    status: "novo", // admin muda depois: "pago", "enviado", "entregue", etc
    customer: { nome, whatsapp, endereco },
    payment: { method: pagamento },
    notes: obs,

    items: cart.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      image: i.image,
      subtotal: i.price * i.qty
    })),

    pricing: {
      subtotal,
      discount,
      shipping,
      total,
      couponCode: pricing.couponCode || "",
      cep: pricing.cep || "",
      eta: pricing.eta || ""
    },

    createdAt: serverTimestamp(),
    createdAtClient: new Date().toISOString()
  };

  // UI lock
  const btn = form.querySelector('button[type="submit"]');
  const oldBtnText = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Enviando...";
  }

  try {
    const ref = await addDoc(collection(db, "pedidos"), order);

    // limpa carrinho + pricing
    localStorage.removeItem("cart");
    sessionStorage.removeItem("pricingState");
    localStorage.removeItem("pricingState");

    // dispara evento (pra qualquer componente reagir)
    window.dispatchEvent(new Event("cartUpdated"));

    // redireciona para sucesso com id
    location.href = `success.html?id=${ref.id}`;
  } catch (err) {
    console.error(err);
    alert("Erro ao enviar pedido. Tente novamente.");
    if (btn) {
      btn.disabled = false;
      btn.textContent = oldBtnText || "ENVIAR PEDIDO 🚀";
    }
  }
});
