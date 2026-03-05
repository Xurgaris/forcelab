// /js/checkout.js
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { requireAuth } from "/cliente/_shared/auth.js";

/* ==========================
   HELPERS
========================== */
function brl(n) {
  return Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeCart(raw) {
  const cart = Array.isArray(raw) ? raw : [];
  return cart
    .map((i) => ({
      type: i?.type || "product",
      id: i?.id ?? null,
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

/* ==========================
   UI ELEMENTS (checkout.html)
========================== */
const form = document.getElementById("checkoutForm");
const itemsWrap = document.getElementById("checkoutItems");
const sumTotal = document.getElementById("sumTotal");
const sumSubtotal = document.getElementById("sumSubtotal");
const sumDiscount = document.getElementById("sumDiscount");
const sumShipping = document.getElementById("sumShipping");
const sumETA = document.getElementById("sumETA");
const summaryItems = document.getElementById("summaryItems");
const payMsg = document.getElementById("payMsg"); // se existir

function renderSummary() {
  const cart = normalizeCart(JSON.parse(localStorage.getItem("cart")) || []);
  if (itemsWrap) itemsWrap.innerHTML = "";

  let subtotal = 0;

  if (cart.length === 0) {
    if (itemsWrap)
      itemsWrap.innerHTML = `<p class="muted">Seu carrinho está vazio.</p>`;
  } else {
    cart.forEach((i) => {
      subtotal += i.price * i.qty;
      if (itemsWrap) {
        itemsWrap.innerHTML += `
          <div class="checkout-item">
            <img src="${i.image}" alt="${i.name}">
            <div>
              <strong>${i.name}</strong>
              <small>${i.qty}x • ${brl(i.price)}</small>
            </div>
            <span class="checkout-sub">${brl(i.price * i.qty)}</span>
          </div>
        `;
      }
    });
  }

  const pricing = getPricingState();
  const discount = Math.min(Number(pricing.discount || 0), subtotal);
  const shipping = Number(pricing.shipping || 0);
  const total = Math.max(0, subtotal - discount + shipping);

  if (sumSubtotal) sumSubtotal.textContent = brl(subtotal);
  if (sumDiscount) sumDiscount.textContent = `- ${brl(discount)}`;
  if (sumShipping) sumShipping.textContent = brl(shipping);
  if (sumTotal) sumTotal.textContent = brl(total);
  if (sumETA)
    sumETA.textContent = pricing.eta
      ? pricing.eta
      : "Calcule o frete informando seu CEP.";
  if (summaryItems) summaryItems.textContent = `${cart.length} itens`;

  return { cart, subtotal, discount, shipping, total, pricing };
}

renderSummary();
window.addEventListener("cartUpdated", renderSummary);

/* ==========================
   PIX MODAL (opcional)
========================== */
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

/* ==========================
   PAY STEPS UI (você já tem)
========================== */
const stepsOverlay = document.getElementById("paySteps");
const stepsTitle = document.getElementById("payStepsTitle");
const stepsSub = document.getElementById("payStepsSub");
const payBar = document.getElementById("payBar");

function openPaySteps() {
  if (!stepsOverlay) return;
  stepsOverlay.classList.add("open");
  stepsOverlay.setAttribute("aria-hidden", "false");
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
  if (payBar && typeof progress === "number")
    payBar.style.width = `${progress}%`;
}

/* ==========================
   AUTH GUARD (precisa logar)
========================== */
const user = await requireAuth();
if (!user) {
  alert("Você precisa estar logado para finalizar o pedido.");
  location.href = "/cliente/login/";
}

/* ==========================
   MERCADO PAGO BRICK
========================== */
// ⚠️ IMPORTANTE:
// Use aqui a SUA PUBLIC KEY (não Access Token).
const MP_PUBLIC_KEY = "APP_USR-552b9b15-749f-4aad-b174-f57fe8e2f0eb";
const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
const bricksBuilder = mp.bricks();

async function initPaymentBrick() {
  const state = renderSummary();
  if (!state.total || state.total <= 0) {
    if (payMsg) payMsg.textContent = "Carrinho vazio.";
    return;
  }
  const container = document.getElementById("paymentBrick_container");
  if (!container) {
    console.warn("paymentBrick_container não encontrado. Brick não iniciado.");
    return;
  }
  await bricksBuilder.create("payment", "paymentBrick_container", {
    initialization: {
      amount: Number(state.total.toFixed(2)),
    },
    customization: {
      paymentMethods: {
        creditCard: "all",
        debitCard: "all",
        bankTransfer: "all",
      },
    },
    callbacks: {
      onReady: () => {},

      onSubmit: async ({ formData }) => {
        // 1) valida dados do cliente
        const fd = new FormData(form);
        const nome = String(fd.get("nome") || "").trim();
        const whatsapp = String(fd.get("whatsapp") || "").trim();
        const endereco = String(fd.get("endereco") || "").trim();
        const pagamento = String(fd.get("pagamento") || "").trim();
        const obs = String(fd.get("obs") || "").trim();

        if (!nome || !whatsapp || !endereco) {
          alert("Preencha nome, WhatsApp e endereço.");
          return;
        }

        // 2) recalcula valores reais
        const s2 = renderSummary();
        const cart = s2.cart;
        const subtotal = calcSubtotal(cart);
        const discount = Math.min(Number(s2.discount || 0), subtotal);
        const shipping = Number(s2.shipping || 0);
        const totalReal = Math.max(0, subtotal - discount + shipping);

        if (!cart.length || totalReal <= 0) {
          alert("Carrinho vazio.");
          return;
        }

        // 3) cria pedido em orders (cliente)
        openPaySteps();
        setStep("Criando pedido…", "Salvando informações do seu pedido.", 20);

        const orderDoc = {
          uid: user.uid,
          status: "aguardando_pagamento",

          customer: { nome, whatsapp },
          shipping: { endereco },
          payment: { metodo: pagamento || "Brick" },
          notes: obs || null,

          items: cart.map((i) => ({
            type: i.type || "product",
            id: i.id ?? null,
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
            couponCode: s2.pricing?.couponCode || "",
            cep: s2.pricing?.cep || "",
            eta: s2.pricing?.eta || "",
          },

          createdAt: serverTimestamp(),
          createdAtClient: new Date().toISOString(),

          mp: {
            paymentId: null,
            status: null,
            method: null,
          },
        };

        const ref = await addDoc(collection(db, "orders"), orderDoc);
        const orderId = ref.id;

        setStep("Criando pagamento…", "Enviando dados ao Mercado Pago.", 45);

        // 4) chama backend (Netlify Function) pra criar pagamento
        const res = await fetch("/.netlify/functions/mp-create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: Number(totalReal.toFixed(2)),
            formData, // token/método/etc do Brick
            customer: { nome, whatsapp },
          }),
        });

        const data = await res.json();

        if (!data?.ok) {
          setStep("Falha no pagamento", data?.error || "Tente novamente.", 0);
          alert(data?.error || "Falha ao criar pagamento.");
          closePaySteps();
          return;
        }

        // 5) salva infos do pagamento no pedido (se veio paymentId)
        if (data?.paymentId) {
          try {
            await updateDoc(doc(db, "orders", orderId), {
              "mp.paymentId": data.paymentId,
              "mp.status": data.status || null,
              "mp.method": data.paymentMethod || null,
            });
          } catch (e) {
            console.warn("Não consegui atualizar mp no pedido:", e);
          }
        }

        // 6) Pix: mostra QR (se veio)
        if (data.pix?.qr_code_base64) {
          setStep("Pix gerado ✅", "Escaneie o QR Code para pagar.", 80);
          if (payMsg) payMsg.textContent = "Pix gerado! Escaneie o QR Code.";

          openPixModal({
            qr_code_base64: data.pix.qr_code_base64,
            qr_code: data.pix.qr_code,
          });

          // opcional: manda para página de status
          // location.href = `success.html?id=${encodeURIComponent(orderId)}`;
          return;
        }

        // 7) cartão/débito: manda para página de sucesso/status
        setStep("Pagamento enviado ✅", "Aguardando confirmação.", 90);

        // limpa carrinho (pedido criado com sucesso)
        localStorage.setItem("cart", "[]");
        window.dispatchEvent(new Event("cartUpdated"));

        location.href = `success.html?id=${encodeURIComponent(orderId)}`;
      },

      onError: (err) => {
        console.error(err);
        alert("Erro no pagamento. Tente novamente.");
        closePaySteps();
      },
    },
  });
}

initPaymentBrick();
