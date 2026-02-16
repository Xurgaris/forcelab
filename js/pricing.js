// ===============================
// PRICING: frete + cupom + resumo
// ===============================

function brl(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function getSubtotal() {
  const cart = getCart();
  return cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );
}

function sanitizeCEP(raw) {
  return String(raw || "").replace(/\D/g, "").slice(0, 8);
}

/**
 * FRETE SIMULADO (ajustável)
 * - CEP inválido => erro
 * - Frete grátis acima de R$ 299
 * - "Sudeste" simulado por faixa 01000000-39999999 => mais barato
 * - Serviços: padrão + expresso
 */
function calcShipping(cep, subtotal) {
  cep = sanitizeCEP(cep);
  if (cep.length !== 8) return { ok: false, message: "CEP inválido. Use 8 dígitos." };

  if (subtotal >= 299) {
    return {
      ok: true,
      services: [{ id: "free", label: "Frete Grátis", value: 0, eta: "3–7 dias úteis" }],
    };
  }

  const cepNum = Number(cep);
  const isSudeste = cepNum >= 1000000 && cepNum <= 39999999;

  const standard = isSudeste ? 19.9 : 29.9;
  const express = isSudeste ? 29.9 : 44.9;

  return {
    ok: true,
    services: [
      { id: "standard", label: "Padrão", value: standard, eta: isSudeste ? "2–5 dias úteis" : "4–9 dias úteis" },
      { id: "express", label: "Expresso", value: express, eta: isSudeste ? "1–2 dias úteis" : "2–4 dias úteis" },
    ],
  };
}

/**
 * CUPONS
 * type: "percent" ou "fixed"
 * min: subtotal mínimo
 * maxDiscount: teto (opcional)
 */
const COUPONS = {
  FORCE10: { type: "percent", value: 10, min: 99, label: "10% OFF" },
  PIX7: { type: "percent", value: 7, min: 50, label: "7% OFF (Pix)" },
  OFF25: { type: "fixed", value: 25, min: 199, label: "R$ 25 OFF" },
};

function calcDiscount(subtotal, couponCode) {
  const code = String(couponCode || "").trim().toUpperCase();
  if (!code) return { ok: true, code: "", discount: 0, message: "" };

  const c = COUPONS[code];
  if (!c) return { ok: false, code, discount: 0, message: "Cupom inválido." };

  if (subtotal < (c.min || 0)) {
    return { ok: false, code, discount: 0, message: `Cupom válido acima de ${brl(c.min)}.` };
  }

  let discount = 0;
  if (c.type === "percent") discount = subtotal * (c.value / 100);
  if (c.type === "fixed") discount = c.value;

  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, subtotal);

  return { ok: true, code, discount, message: `Aplicado: ${c.label}` };
}

// estado persistido
function getPricingState() {
  try {
    return (
      JSON.parse(localStorage.getItem("pricing")) || {
        cep: "",
        shippingService: "standard",
        coupon: "",
      }
    );
  } catch {
    return { cep: "", shippingService: "standard", coupon: "" };
  }
}

function setPricingState(next) {
  localStorage.setItem("pricing", JSON.stringify(next));
}

function computeTotals() {
  const subtotal = getSubtotal();
  const state = getPricingState();

  const ship = calcShipping(state.cep, subtotal);

  let shippingValue = 0;
  let shippingEta = "";
  let shippingService = state.shippingService || "standard";

  if (ship.ok) {
    const services = ship.services || [];
    const chosen = services.find((s) => s.id === shippingService) || services[0];
    shippingService = chosen?.id || shippingService;
    shippingValue = Number(chosen?.value || 0);
    shippingEta = chosen?.eta || "";
  } else {
    shippingValue = 0;
    shippingEta = "";
  }

  const disc = calcDiscount(subtotal, state.coupon);
  const discount = disc.ok ? Number(disc.discount || 0) : 0;

  const total = Math.max(0, subtotal - discount + shippingValue);

  return {
    subtotal,
    discount,
    shippingValue,
    shippingEta,
    shippingService,
    ship,
    disc,
    total,
  };
}

export function initPricingUI() {
  // ids do teu HTML (cart.html)
  const elSubtotal = document.getElementById("sumSubtotal");
  const elDiscount = document.getElementById("sumDiscount");
  const elShipping = document.getElementById("sumShipping");
  const elTotal = document.getElementById("sumTotal");
  const elItems = document.getElementById("summaryItems");
  const elETA = document.getElementById("sumETA");

  const cepInput = document.getElementById("cepInput");
  const btnCalc = document.getElementById("calcShipping");
  const shipMsg = document.getElementById("shipMsg");

  const couponInput = document.getElementById("couponInput");
  const btnCoupon = document.getElementById("applyCoupon");
  const couponMsg = document.getElementById("couponMsg");

  // se não for a página do carrinho, só sai
  if (!elSubtotal || !elTotal) return;

  // carregar estado
  const state = getPricingState();
  if (cepInput) cepInput.value = state.cep || "";
  if (couponInput) couponInput.value = state.coupon || "";

  function render() {
    const cart = getCart();
    const t = computeTotals();

    if (elItems) {
      const count = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
      elItems.textContent = `${count} itens`;
    }

    elSubtotal.textContent = brl(t.subtotal);
    if (elDiscount) elDiscount.textContent = `- ${brl(t.discount)}`;
    if (elShipping) elShipping.textContent = brl(t.shippingValue);
    elTotal.textContent = brl(t.total);

    // mensagens de frete
    if (shipMsg) {
      const hasCep = (getPricingState().cep || "").trim().length > 0;
      if (!t.ship.ok && hasCep) shipMsg.textContent = t.ship.message;
      else if (t.ship.ok && t.shippingEta) shipMsg.textContent = `Entrega estimada: ${t.shippingEta}`;
      else shipMsg.textContent = "";
    }
    if (elETA) {
      const hasCep = (getPricingState().cep || "").trim().length > 0;
      if (!t.ship.ok && hasCep) elETA.textContent = "Calcule o frete informando seu CEP.";
      else if (t.ship.ok && t.shippingEta) elETA.textContent = `Entrega estimada: ${t.shippingEta}`;
      else elETA.textContent = "Calcule o frete informando seu CEP.";
    }

    // mensagens do cupom
    if (couponMsg) {
      const hasCoupon = (getPricingState().coupon || "").trim().length > 0;
      if (!t.disc.ok && hasCoupon) couponMsg.textContent = t.disc.message;
      else if (t.disc.ok && t.disc.message) couponMsg.textContent = t.disc.message;
      else couponMsg.textContent = "";
    }

    // exporta resumo final (checkout pode ler isso)
    const pricingState = {
      subtotal: t.subtotal,
      discount: t.discount,
      shipping: t.shippingValue,
      eta: t.shippingEta,
      cep: getPricingState().cep || "",
      couponCode: getPricingState().coupon || "",
      total: t.total,
      shippingService: t.shippingService,
    };
    localStorage.setItem("pricingState", JSON.stringify(pricingState));
  }

  function updateState(patch) {
    const cur = getPricingState();
    const next = { ...cur, ...patch };
    setPricingState(next);
    render();
  }

  btnCalc?.addEventListener("click", () => {
    const cep = sanitizeCEP(cepInput?.value);
    updateState({ cep });
  });

  cepInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cep = sanitizeCEP(cepInput.value);
      updateState({ cep });
    }
  });

  btnCoupon?.addEventListener("click", () => {
    const coupon = String(couponInput?.value || "").trim().toUpperCase();
    updateState({ coupon });
  });

  couponInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const coupon = String(couponInput.value || "").trim().toUpperCase();
      updateState({ coupon });
    }
  });

  // quando carrinho muda (cart.js pode disparar isso)
  window.addEventListener("cartUpdated", render);
  window.addEventListener("storage", render);

  render();
}
