// /js/checkout.js
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

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
      qty: Math.max(1, Number(i?.qty) || 1),
      image: i?.image || "https://via.placeholder.com/80",
    }))
    .filter((i) => i.qty > 0);
}

function getPricingState() {
  const s =
    sessionStorage.getItem("pricingState") ||
    localStorage.getItem("pricingState") ||
    "{}";

  try {
    const parsed = JSON.parse(s);
    return {
      couponCode: String(parsed.couponCode || ""),
      discount: Number(parsed.discount) || 0,
      shipping: Number(parsed.shipping) || 0,
      eta: String(parsed.eta || ""),
      cep: String(parsed.cep || ""),
    };
  } catch {
    return { couponCode: "", discount: 0, shipping: 0, eta: "", cep: "" };
  }
}

function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

// ========= UI =========
const form = document.querySelector(".checkout-form");
const boxItems = document.getElementById("miniCartItems");
const boxTotal = document.getElementById("miniTotal");
const payMsg = document.getElementById("payMsg");

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
  return { cart, subtotal, total, pricing };
}

renderSummary();
window.addEventListener("cartUpdated", renderSummary);

// ========= PIX MODAL (se você colou o modal) =========
function openPixModal({ qr_code_base64, qr_code }) {
  const modal = document.getElementById("pixModal");
  const img = document.getElementById("pixQrImg");
  const code = document.getElementById("pixCode");
  if (!modal || !img || !code) return;

  img.src = `data:image/png;base64,${qr_code_base64}`;
  code.value = qr_code || "";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePixModal() {
  const modal = document.getElementById("pixModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.addEventListener("click", (e) => {
  if (e.target?.matches?.('[data-close="pix"]')) closePixModal();
});

document.getElementById("pixCopyBtn")?.addEventListener("click", async () => {
  const code = document.getElementById("pixCode")?.value || "";
  const msg = document.getElementById("pixCopyMsg");
  try {
    await navigator.clipboard.writeText(code);
    if (msg) msg.textContent = "Copiado! Cole no app do banco.";
  } catch {
    if (msg) msg.textContent = "Não foi possível copiar. Copie manualmente.";
  }
});

// ========= Mercado Pago Brick =========
// ⚠️ Você precisa ter o <script src="https://sdk.mercadopago.com/js/v2"></script> no checkout.html
const MP_PUBLIC_KEY = "APP_USR-552b9b15-749f-4aad-b174-f57fe8e2f0eb"; // ok ficar no front
const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
const bricksBuilder = mp.bricks();

// Renderiza o Brick de pagamento
(async function initPaymentBrick() {
  const { total } = renderSummary();
  if (!total || total <= 0) {
    if (payMsg) payMsg.textContent = "Carrinho vazio.";
    return;
  }

  await bricksBuilder.create("payment", "paymentBrick_container", {
    initialization: {
      amount: Number(total.toFixed(2)),
    },
    customization: {
      paymentMethods: {
        pix: "all",
        creditCard: "all",
        debitCard: "all",
      },
    },
    callbacks: {
      onReady: () => {},
      onSubmit: async ({ formData }) => {
        // 1) valida dados do cliente (do seu form)
        const fd = new FormData(form);
        const nome = String(fd.get("nome") || "").trim();
        const whatsapp = String(fd.get("whatsapp") || "").trim();
        const endereco = String(fd.get("endereco") || "").trim();
        const obs = String(fd.get("obs") || "").trim();

        if (!nome || !whatsapp || !endereco) {
          alert("Preencha nome, WhatsApp e endereço.");
          return;
        }

        // 2) pega carrinho/total novamente (evita valores velhos)
        const state = renderSummary();
        const cart = state.cart;
        const pricing = state.pricing;

        const subtotal = calcSubtotal(cart);
        const discount = Math.min(Number(pricing.discount || 0), subtotal);
        const shipping = Number(pricing.shipping || 0);
        const totalReal = Math.max(0, subtotal - discount + shipping);

        // 3) cria pedido no Firestore primeiro (status aguardando)
        const order = {
          status: "aguardando_pagamento",
          customer: { nome, whatsapp, endereco },
          notes: obs,
          items: cart.map((i) => ({
            name: i.name,
            price: i.price,
            qty: i.qty,
            image: i.image,
            subtotal: i.price * i.qty,
          })),
          pricing: {
            subtotal,
            discount,
            shipping,
            total: totalReal,
            couponCode: pricing.couponCode || "",
            cep: pricing.cep || "",
            eta: pricing.eta || "",
          },
          createdAt: serverTimestamp(),
          createdAtClient: new Date().toISOString(),
        };

        if (payMsg) payMsg.textContent = "Criando pagamento…";

        const ref = await addDoc(collection(db, "pedidos"), order);
        const orderId = ref.id;


        // 4) chama seu backend (Netlify Function) pra criar pagamento no MP
        const res = await fetch("/.netlify/functions/mp-create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: ref.id,
            amount: Number(totalReal.toFixed(2)),
            formData, // vem do Brick (token/método/etc)
            customer: { nome, whatsapp },
          }),
        });

        const data = await res.json();

        if (!data?.ok) {
          if (payMsg) payMsg.textContent = data?.error || "Falha ao criar pagamento.";
          alert(data?.error || "Falha ao criar pagamento.");
          return;
        }

        // 5) Se for Pix, mostrar QR
        if (data.pix?.qr_code_base64) {
          if (payMsg) payMsg.textContent = "Pix gerado! Escaneie o QR Code.";
          openPixModal({
            qr_code_base64: data.pix.qr_code_base64,
            qr_code: data.pix.qr_code,
          });
          return;
        }

        // 6) Cartão/débito: só informar e aguardar webhook
        if (payMsg) payMsg.textContent = "Pagamento enviado. Aguarde confirmação.";

        // você pode mandar pra uma tela “aguardando”
        // location.href = `success.html?id=${ref.id}`;
      },
      onError: (err) => {
        console.error(err);
        if (payMsg) payMsg.textContent = "Erro no pagamento. Tente novamente.";
      },
    },
  });
  location.href = `success.html?id=${orderId}`;
})();


// ===== PAY STEPS UI =====
const stepsOverlay = document.getElementById("paySteps");
const stepsTitle = document.getElementById("payStepsTitle");
const stepsSub = document.getElementById("payStepsSub");
const payBar = document.getElementById("payBar");

function openPaySteps() {
  if (!stepsOverlay) return;
  stepsOverlay.classList.add("open");
  stepsOverlay.setAttribute("aria-hidden", "false");
  stepsOverlay.classList.remove("done");
  document.body.style.overflow = "hidden";
}
function closePaySteps() {
  if (!stepsOverlay) return;
  stepsOverlay.classList.remove("open");
  stepsOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function setStep(title, sub, progress = null) {
  if (stepsTitle) stepsTitle.textContent = title;
  if (stepsSub) stepsSub.textContent = sub;
  if (payBar && typeof progress === "number") payBar.style.width = `${progress}%`;
}
function setDone(title = "Pagamento realizado ✅", sub = "Obrigado! Pedido confirmado.") {
  if (!stepsOverlay) return;
  stepsOverlay.classList.add("done");
  setStep(title, sub, 100);
  // fecha sozinho ou redireciona
  setTimeout(() => closePaySteps(), 1200);
}

// anima frases enquanto verifica
function startStepSequence() {
  openPaySteps();

  const seq = [
    ["Confirmando pagamento…", "Aguarde um instante.", 20],
    ["Quase lá…", "Estamos validando a transação.", 45],
    ["Verificando confirmação…", "Isso pode levar alguns segundos no Pix.", 68],
  ];

  let i = 0;
  const timer = setInterval(() => {
    const s = seq[i % seq.length];
    setStep(s[0], s[1], s[2]);
    i++;
  }, 1800);

  return () => clearInterval(timer); // retorna "stopper"
}

// ===== POLLING (consulta status do pagamento) =====
async function pollPaymentStatus(paymentId, { timeoutMs = 120000, intervalMs = 3000 } = {}) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`/.netlify/functions/mp-get-payment?payment_id=${encodeURIComponent(paymentId)}`);
    const data = await res.json();

    if (data?.ok) {
      // approved | pending | rejected | in_process
      const st = data.status;

      if (st === "approved") return { ok: true, status: st };
      if (st === "rejected" || st === "cancelled") return { ok: false, status: st };
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return { ok: false, status: "timeout" };
}