(function () {
  // ========= Helpers =========
  function brl(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  }

  function normalizeCep(raw) {
    return String(raw || "").replace(/\D/g, "").slice(0, 8);
  }

  // ========= Cupoms (edite aqui) =========
  // percent: 0.10 = 10%
  // fixed: desconto fixo em reais
  const COUPONS = {
    "FORCELAB10": { percent: 0.10, label: "10% OFF" },
    "PRIMEIRO20": { fixed: 20, label: "R$ 20 OFF" },
  };

  function computeSubtotal(cart) {
    return cart.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  }

  function getAppliedCoupon() {
    const code = (sessionStorage.getItem("coupon") || "").trim().toUpperCase();
    return code;
  }

  function applyCouponToSubtotal(subtotal, code) {
    const c = COUPONS[code];
    if (!c) return { discount: 0, ok: false, label: "" };

    let discount = 0;
    if (c.percent) discount = subtotal * c.percent;
    if (c.fixed) discount = c.fixed;

    // não deixa desconto passar do subtotal
    discount = Math.min(discount, subtotal);

    return { discount, ok: true, label: c.label || code };
  }

  // ========= Frete (estimativa simples) =========
  // Regra:
  // - Se subtotal >= 199 => frete grátis
  // - Senão: baseado no 1º dígito do CEP (0-3 / 4-6 / 7-9)
  function calcShipping(subtotal, cepDigits) {
    if (!cepDigits || cepDigits.length < 8) {
      return { ok: false, price: 0, eta: "" };
    }

    if (subtotal >= 199) {
      return { ok: true, price: 0, eta: "Frete grátis • entrega estimada 3–7 dias úteis" };
    }

    const first = Number(cepDigits[0]); // 0..9
    let price = 19.9;
    let eta = "Entrega estimada 3–7 dias úteis";

    if (first >= 4 && first <= 6) {
      price = 24.9;
      eta = "Entrega estimada 4–9 dias úteis";
    } else if (first >= 7) {
      price = 29.9;
      eta = "Entrega estimada 6–12 dias úteis";
    }

    return { ok: true, price, eta };
  }

  function getSavedShipping() {
    try {
      return JSON.parse(sessionStorage.getItem("shipping") || "null");
    } catch {
      return null;
    }
  }

  function saveShipping(obj) {
    sessionStorage.setItem("shipping", JSON.stringify(obj));
  }

  // ========= UI =========
  const elItems = document.getElementById("summaryItems");
  const elSubtotal = document.getElementById("sumSubtotal");
  const elDiscount = document.getElementById("sumDiscount");
  const elShipping = document.getElementById("sumShipping");
  const elTotal = document.getElementById("sumTotal");
  const elETA = document.getElementById("sumETA");

  const couponInput = document.getElementById("couponInput");
  const couponMsg = document.getElementById("couponMsg");
  const btnApplyCoupon = document.getElementById("applyCoupon");

  const cepInput = document.getElementById("cepInput");
  const shipMsg = document.getElementById("shipMsg");
  const btnCalcShipping = document.getElementById("calcShipping");

  if (couponInput) couponInput.value = getAppliedCoupon();

  // ========= Render =========
  function render() {
    const cart = getCart();
    const subtotal = computeSubtotal(cart);

    // itens
    const itemsCount = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    if (elItems) elItems.textContent = `${itemsCount} ${itemsCount === 1 ? "item" : "itens"}`;

    // cupom
    const code = getAppliedCoupon();
    const couponResult = applyCouponToSubtotal(subtotal, code);

    // frete
    const saved = getSavedShipping();
    let shippingPrice = 0;
    let eta = "Calcule o frete informando seu CEP.";

    if (saved?.ok) {
      shippingPrice = Number(saved.price) || 0;
      eta = saved.eta || eta;

      // Se subtotal virou frete grátis, atualiza automaticamente
      const cepDigits = normalizeCep(saved.cep);
      const recalced = calcShipping(subtotal, cepDigits);
      if (recalced.ok && (recalced.price !== shippingPrice || recalced.eta !== eta)) {
        saveShipping({ ok: true, cep: cepDigits, price: recalced.price, eta: recalced.eta });
        shippingPrice = recalced.price;
        eta = recalced.eta;
      }
    }

    const total = Math.max(0, subtotal - couponResult.discount + shippingPrice);

    if (elSubtotal) elSubtotal.textContent = brl(subtotal);
    if (elDiscount) elDiscount.textContent = `- ${brl(couponResult.discount)}`;
    if (elShipping) elShipping.textContent = brl(shippingPrice);
    if (elTotal) elTotal.textContent = brl(total);
    if (elETA) elETA.textContent = eta;

    // mensagens
    if (couponMsg) {
      if (!code) couponMsg.textContent = "";
      else couponMsg.textContent = couponResult.ok ? `Cupom aplicado: ${code} (${couponResult.label})` : "Cupom inválido.";
      couponMsg.classList.toggle("ok", couponResult.ok);
      couponMsg.classList.toggle("bad", !!code && !couponResult.ok);
    }

    if (shipMsg && saved?.ok) {
      shipMsg.textContent = `CEP ${saved.cep.slice(0,5)}-${saved.cep.slice(5)} • ${brl(shippingPrice)} • ${eta}`;
      shipMsg.classList.add("ok");
      shipMsg.classList.remove("bad");
    }
  }

  // ========= Ações =========
  btnApplyCoupon?.addEventListener("click", () => {
    const code = (couponInput?.value || "").trim().toUpperCase();
    if (!code) {
      sessionStorage.removeItem("coupon");
      render();
      return;
    }
    sessionStorage.setItem("coupon", code);
    render();
  });

  couponInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnApplyCoupon?.click();
    }
  });

  // mascara CEP simples
  cepInput?.addEventListener("input", () => {
    const digits = normalizeCep(cepInput.value);
    if (digits.length > 5) {
      cepInput.value = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      cepInput.value = digits;
    }
  });

  btnCalcShipping?.addEventListener("click", () => {
    const cart = getCart();
    const subtotal = computeSubtotal(cart);
    const cepDigits = normalizeCep(cepInput?.value);

    if (cepDigits.length < 8) {
      if (shipMsg) {
        shipMsg.textContent = "Digite um CEP válido (8 números).";
        shipMsg.classList.add("bad");
        shipMsg.classList.remove("ok");
      }
      saveShipping({ ok: false });
      render();
      return;
    }

    const ship = calcShipping(subtotal, cepDigits);
    if (ship.ok) {
      saveShipping({ ok: true, cep: cepDigits, price: ship.price, eta: ship.eta });
      if (shipMsg) {
        shipMsg.textContent = `CEP ${cepDigits.slice(0,5)}-${cepDigits.slice(5)} • ${brl(ship.price)} • ${ship.eta}`;
        shipMsg.classList.add("ok");
        shipMsg.classList.remove("bad");
      }
    }
    render();
  });

  // ========= Evento do carrinho =========
  window.addEventListener("cartUpdated", () => {
    render();
  });

  // primeira renderização
  render();
})();
