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
    const p = JSON.parse(s);
    return {
      couponCode: String(p.couponCode || ""),
      discount: Number(p.discount) || 0,
      shipping: Number(p.shipping) || 0,
      eta: String(p.eta || ""),
      cep: String(p.cep || ""),
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
const sumShipping = document.getElementById("sumShipping");
const sumETA = document.getElementById("sumETA");
const summaryItems = document.getElementById("summaryItems");
const payMsg = document.getElementById("payMsg");

function renderSummary() {
  const cart = normalizeCart(JSON.parse(localStorage.getItem("cart")) || []);
  if (itemsWrap) itemsWrap.innerHTML = "";

  let subtotal = 0;

  if (!cart.length) {
    if (itemsWrap)
      itemsWrap.innerHTML = `<p class="muted">Seu carrinho está vazio.</p>`;
  } else {
    for (const i of cart) {
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
    }
  }

  const pricing = getPricingState();
  const discount = Math.min(Number(pricing.discount || 0), subtotal);
  const shipping = Number(pricing.shipping || 0);
  const total = Math.max(0, subtotal - discount + shipping);

  if (sumSubtotal) sumSubtotal.textContent = brl(subtotal);
  if (sumShipping) sumShipping.textContent = brl(shipping);
  if (sumTotal) sumTotal.textContent = brl(total);

  if (sumETA) {
    sumETA.textContent = pricing.eta
      ? pricing.eta
      : "Calcule o frete informando seu CEP.";
  }
  if (summaryItems) summaryItems.textContent = `${cart.length} itens`;

  return { cart, subtotal, discount, shipping, total, pricing };
}

renderSummary();
window.addEventListener("cartUpdated", renderSummary);

/* ==========================
   PAY STEPS UI
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
   PIX MODAL (se existir no HTML)
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

/* ==========================
   AUTH GUARD
========================== */
const user = await requireAuth();
if (!user) {
  alert("Você precisa estar logado para finalizar o pedido.");
  location.href = "/cliente/login/";
}

/* ==========================
   MERCADO PAGO BRICK
========================== */
const MP_PUBLIC_KEY = "APP_USR-e746dbd7-36bc-487d-b738-348aa3593fb6";
const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
const bricksBuilder = mp.bricks();

let brickMounted = false;

async function initPaymentBrick() {
  if (brickMounted) return;

  const container = document.getElementById("paymentBrick_container");
  if (!container) {
    console.error("Não encontrei #paymentBrick_container");
    return;
  }

  const state = renderSummary();
  if (!state.total || state.total <= 0) return;

  brickMounted = true;
  container.innerHTML = "";

  await bricksBuilder.create("payment", "paymentBrick_container", {
    initialization: {
      amount: Number(state.total.toFixed(2)),
      // opcional (prefill): payer: { email: ... }
    },
    customization: {
      paymentMethods: {
        creditCard: "all",
        debitCard: "all",
        bankTransfer: ["pix"], // ✅ Pix no Brasil
        // NÃO setar ticket/atm/mercadoPago aqui
      },
      visual: {
        // opcional: já abre com Pix selecionado
        defaultPaymentOption: { bankTransferForm: true },
      },
    },
    callbacks: {
      onReady: () => {},

      onError: (err) => {
        console.error("Brick onError:", err);
        if (payMsg)
          payMsg.textContent = "Erro ao carregar pagamento. Veja o console.";
      },

      onSubmit: ({ formData }) => {
        // ✅ IMPORTANTE: devolver Promise (o Brick espera isso)
        return new Promise(async (resolve, reject) => {
          try {
            console.log("Brick formData:", formData);

            // 1) valida form
            const fd = new FormData(form);
            const email = String(fd.get("email") || "").trim();
            const nome = String(fd.get("nome") || "").trim();
            const whatsapp = String(fd.get("whatsapp") || "").trim();
            const endereco = String(fd.get("endereco") || "").trim();
            const obs = String(fd.get("obs") || "").trim();

            if (!email || !email.includes("@")) {
              alert("Informe um e-mail válido.");
              return reject(new Error("Email inválido"));
            }
            if (!nome || !whatsapp || !endereco) {
              alert("Preencha Nome, WhatsApp e Endereço.");
              return reject(new Error("Dados do cliente incompletos"));
            }

            // 2) recalcula total
            const s2 = renderSummary();
            const cart = s2.cart;
            const subtotal = calcSubtotal(cart);
            const discount = Math.min(Number(s2.discount || 0), subtotal);
            const shipping = Number(s2.shipping || 0);
            const totalReal = Math.max(0, subtotal - discount + shipping);

            if (!cart.length || totalReal <= 0) {
              alert("Carrinho vazio.");
              return reject(new Error("Carrinho vazio"));
            }

            // 3) cria order no Firestore
            openPaySteps();
            setStep(
              "Criando pedido…",
              "Salvando informações do seu pedido.",
              20,
            );

            const orderDoc = {
              uid: user.uid,
              status: "aguardando_pagamento",
              customer: { nome, whatsapp, email },
              shipping: { endereco },
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
              mp: { paymentId: null, status: null, method: null },
            };

            const ref = await addDoc(collection(db, "orders"), orderDoc);
            const orderId = ref.id;

            setStep(
              "Criando pagamento…",
              "Enviando dados ao Mercado Pago.",
              55,
            );

            // 4) backend MP
            const res = await fetch("/.netlify/functions/mp-create-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                amount: Number(totalReal.toFixed(2)),
                formData,
                customer: { nome, whatsapp, email },
              }),
            });

            const raw = await res.text();
            let data = {};
            try {
              data = JSON.parse(raw);
            } catch {
              data = { raw };
            }

            console.log("MP function response:", data, "status:", res.status);

            if (!res.ok || !data?.ok) {
              closePaySteps();
              console.error("MP ERROR FULL:", data);
              alert(
                `Falha ao criar pagamento: ${data?.error || data?.raw || "erro desconhecido"}`,
              );
              return reject(
                new Error(data?.error || "Falha ao criar pagamento"),
              );
            }

            // 5) salva retorno MP no pedido
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

            // 6) Pix -> modal
            if (data.pix?.qr_code_base64) {
              setStep("Pix gerado ✅", "Escaneie o QR Code para pagar.", 90);
              closePaySteps();
              openPixModal({
                qr_code_base64: data.pix.qr_code_base64,
                qr_code: data.pix.qr_code,
              });
              return resolve();
            }

            // 7) cartão -> segue fluxo (webhook/poll depois)
            // 7) cartão -> decide pelo status
            setStep("Pagamento enviado ✅", "Aguardando confirmação.", 90);

            if (data.status === "approved") {
              localStorage.setItem("cart", "[]");
              window.dispatchEvent(new Event("cartUpdated"));
              location.href = `success.html?id=${encodeURIComponent(orderId)}`;
            } else {
              location.href = `pending.html?id=${encodeURIComponent(orderId)}`;
            }
            return resolve();
          } catch (err) {
            console.error("onSubmit error:", err);
            closePaySteps();
            return reject(err);
          }
        });
      },
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPaymentBrick);
} else {
  initPaymentBrick();
}
