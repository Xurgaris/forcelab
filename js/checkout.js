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

// ✅ anti-submit duplicado + reaproveitar pedido
let currentOrderId = null;
let creatingOrder = false;

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

// remove width/height vazios de SVGs dentro do Brick
function fixBrickSvg() {
  const root = document.getElementById("paymentBrick_container");
  if (!root) return;

  const sanitize = () => {
    root.querySelectorAll("svg").forEach((svg) => {
      if (svg.getAttribute("width") === "") svg.removeAttribute("width");
      if (svg.getAttribute("height") === "") svg.removeAttribute("height");
    });
  };

  sanitize();
  const mo = new MutationObserver(sanitize);
  mo.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["width", "height"],
  });
}

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

  // ✅ chama o fix antes do Brick renderizar
  fixBrickSvg();

  await bricksBuilder.create("payment", "paymentBrick_container", {
    initialization: {
      amount: Number(state.total.toFixed(2)),
    },
    customization: {
      paymentMethods: {
        creditCard: "all",
        debitCard: "all",
        bankTransfer: ["pix"],
      },
      visual: {
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
        return new Promise(async (resolve, reject) => {
          if (creatingOrder) return resolve();
          creatingOrder = true;

          try {
            // 1) valida form
            const fd = new FormData(form);
            const email = String(fd.get("email") || "").trim();
            const nome = String(fd.get("nome") || "").trim();
            const whatsapp = String(fd.get("whatsapp") || "").trim();
            const endereco = String(fd.get("endereco") || "").trim();
            const obs = String(fd.get("obs") || "").trim();

            if (!email || !email.includes("@"))
              throw new Error("Informe um e-mail válido.");
            if (!nome || !whatsapp || !endereco)
              throw new Error("Preencha Nome, WhatsApp e Endereço.");

            // 2) recalcula total
            const s2 = renderSummary();
            const cart = s2.cart;
            const subtotal = calcSubtotal(cart);
            const discount = Math.min(Number(s2.discount || 0), subtotal);
            const shipping = Number(s2.shipping || 0);
            const totalReal = Math.max(0, subtotal - discount + shipping);

            if (!cart.length || totalReal <= 0)
              throw new Error("Carrinho vazio.");

            // 3) cria/reusa pedido
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

            let orderId = currentOrderId;

            if (!orderId) {
              const ref = await addDoc(collection(db, "orders"), orderDoc);
              orderId = ref.id;
              currentOrderId = orderId;
            } else {
              await updateDoc(doc(db, "orders", orderId), {
                customer: orderDoc.customer,
                shipping: orderDoc.shipping,
                notes: orderDoc.notes,
                items: orderDoc.items,
                pricing: orderDoc.pricing,
                status: "aguardando_pagamento",
              });
            }

            // 4) cria pagamento no backend
            setStep(
              "Criando pagamento…",
              "Enviando dados ao Mercado Pago.",
              55,
            );

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

            if (!res.ok || !data?.ok) {
              closePaySteps();
              throw new Error(
                data?.error || data?.raw || "Falha ao criar pagamento",
              );
            }

            const paymentId = data?.paymentId;
            if (!paymentId) {
              closePaySteps();
              throw new Error("Pagamento não retornou paymentId.");
            }

            // 5) salva retorno MP no pedido
            await updateDoc(doc(db, "orders", orderId), {
              "mp.paymentId": paymentId,
              "mp.status": data.status || null,
              "mp.method": data.paymentMethod || null,
            });

            // 6) PIX -> abre modal
            if (data.pix?.qr_code_base64) {
              setStep("Pix gerado ✅", "Escaneie o QR Code para pagar.", 90);
              closePaySteps();
              openPixModal({
                qr_code_base64: data.pix.qr_code_base64,
                qr_code: data.pix.qr_code,
              });
              creatingOrder = false;
              return resolve();
            }

            // 7) cartão -> success/pending com paymentId
            setStep("Pagamento enviado ✅", "Confirmando status…", 92);

            if (data.status === "approved") {
              localStorage.setItem("cart", "[]");
              window.dispatchEvent(new Event("cartUpdated"));
              closePaySteps();
              setTimeout(() => {
                location.href = `success.html?id=${encodeURIComponent(orderId)}`;
              }, 50);
            } else {
              closePaySteps();
              setTimeout(() => {
                location.href = `pending.html?id=${encodeURIComponent(orderId)}&paymentId=${encodeURIComponent(paymentId)}`;
              }, 50);
            }

            creatingOrder = false;
            return resolve();
          } catch (err) {
            console.error("onSubmit error:", err);
            closePaySteps();
            creatingOrder = false;
            alert(err.message || "Erro ao finalizar pagamento.");
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
