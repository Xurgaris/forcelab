import { getProductById, getAllProducts } from "./productsFirebase.js";

const wrap = document.getElementById("productWrap");
const relatedGrid = document.getElementById("relatedGrid");

function brl(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function calcOldPrice(price) {
  return Number(price || 0) * 1.18;
}
function calcPixPrice(price) {
  return Number(price || 0) * 0.93;
}
function calcInstallments(price, n = 3) {
  const p = Number(price || 0) / n;
  return p.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function stars(rating = 4.8) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}
function safe(s) {
  return String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escQuotes(s) {
  return String(s || "").replace(/'/g, "\\'");
}
function getId() {
  const params = new URLSearchParams(location.search);
  return params.get("id");
}

function getWhatsappNumber() {
  // pega do seu HTML atual (ex: https://wa.me/5500000000000)
  const link = document.querySelector('a[href^="https://wa.me/"]');
  const href = link?.getAttribute("href") || "";
  const m = href.match(/wa\.me\/(\d+)/);
  return m?.[1] || "5500000000000"; // fallback
}

function buildWhatsappMessage(p, qty, pixPrice) {
  const url = `${location.origin}${location.pathname}?id=${encodeURIComponent(p.id)}`;
  const msg =
    `Olá! Tenho interesse neste produto:\n` +
    `• ${p.name}\n` +
    `• Quantidade: ${qty}\n` +
    `• Valor no Pix: ${brl(pixPrice)}\n` +
    `Link: ${url}\n\n` +
    `Pode me ajudar com o pedido?`;
  return encodeURIComponent(msg);
}

function addWithQty(p, qty, pixPrice) {
  // se seu cart.js não tiver addToCartQty, adiciona item várias vezes (compatível 100%)
  if (typeof window.addToCartQty === "function") {
    window.addToCartQty(p.name, pixPrice, p.image, qty);
  } else {
    for (let i = 0; i < qty; i++) window.addToCart(p.name, pixPrice, p.image);
  }
  window.toggleCart?.();
}

function renderProduct(p) {
  const price = Number(p.price || 0);
  const oldPrice = p.oldPrice ? Number(p.oldPrice) : calcOldPrice(price);
  const pixPrice = p.pixPrice ? Number(p.pixPrice) : calcPixPrice(price);

  const rating = p.rating ?? 4.8;
  const reviews = p.reviews ?? Math.floor(25 + Math.random() * 120);
  const installmentsN = p.installments ?? 3;

  const mainImg = p.image || "https://via.placeholder.com/900x900?text=Produto";

  document.title = `${p.name || "Produto"} | ForceLab Nutrition`;
  const bc = document.getElementById("bcName");
  if (bc) bc.textContent = p.name || "Produto";

  wrap.innerHTML = `
    <div class="product-gallery">
      <div class="product-main-img">
        <img src="${mainImg}" alt="${safe(p.name)}" loading="eager">
      </div>

      <div class="product-badges">
        <span class="badge badge-hot">Frete rápido</span>
        <span class="badge">Pagamento seguro</span>
        <span class="badge">Pix com desconto</span>
      </div>
    </div>

    <div class="product-info">
      <div class="product-topline">
        <span class="product-pill">Loja oficial</span>
        <div class="product-rating">
          <span class="stars" aria-hidden="true">${stars(rating)}</span>
          <span class="count">(${reviews})</span>
        </div>
      </div>

      <h1 class="product-name">${safe(p.name)}</h1>

      <p class="product-short">
        ${safe(p.shortDescription || p.description || "Produto premium com entrega rápida e checkout simples.")}
      </p>

      <div class="product-pricebox">
        <div class="product-prices">
          <span class="from">${brl(oldPrice)}</span>
          <span class="pix">${brl(pixPrice)} <small>no Pix</small></span>
          <span class="installments">ou ${brl(price)} em ${installmentsN}x de ${calcInstallments(price, installmentsN)} sem juros</span>
        </div>

        <div class="qty-row" aria-label="Quantidade">
          <span class="qty-label">Quantidade</span>
          <div class="qty">
            <button class="qty-btn" type="button" id="qtyMinus" aria-label="Diminuir">−</button>
            <input class="qty-input" id="qtyInput" type="number" min="1" value="1" inputmode="numeric" />
            <button class="qty-btn" type="button" id="qtyPlus" aria-label="Aumentar">+</button>
          </div>
        </div>

        <div class="product-ctas">
          <button class="btn-buy" id="buyBtn" type="button">
            Comprar agora
          </button>

          <a class="btn btn-ghost full" href="catalogo.html">Continuar comprando</a>

          <a class="btn btn-ghost full btn-whats" id="whatsBtn" href="#" target="_blank" rel="noreferrer">
            Falar no WhatsApp
          </a>
        </div>

        <div class="product-bullets">
          <div class="bullet"><span class="dot"></span><strong>Envio rápido</strong><small>Despacho 24h útil</small></div>
          <div class="bullet"><span class="dot"></span><strong>Suporte</strong><small>WhatsApp e e-mail</small></div>
          <div class="bullet"><span class="dot"></span><strong>Garantia</strong><small>Produto original</small></div>
        </div>
      </div>

      <div class="product-tabs">
        <button class="tab active" type="button" data-tab="desc">Descrição</button>
        <button class="tab" type="button" data-tab="info">Informações</button>
        <button class="tab" type="button" data-tab="ship">Entrega</button>
      </div>

      <div class="product-tabpanes">
        <div class="pane active" data-pane="desc">
          <p>${safe(p.description || "Descrição do produto. Você pode preencher isso no Firebase.")}</p>
        </div>

        <div class="pane" data-pane="info">
          <ul class="product-list">
            <li><strong>Categoria:</strong> ${safe(p.category || p.tag || "Suplementos")}</li>
            <li><strong>Marca:</strong> ${safe(p.brand || "ForceLab")}</li>
            <li><strong>Conteúdo:</strong> ${safe(p.size || "—")}</li>
            <li><strong>Objetivo:</strong> ${safe(p.goal || "—")}</li>
          </ul>
        </div>

        <div class="pane" data-pane="ship">
          <p>Despachamos rapidamente. O prazo depende da sua região. Após a compra você recebe rastreio.</p>
        </div>
      </div>
    </div>

    <!-- Sticky bar mobile -->
    <div class="sticky-buy" id="stickyBuy" aria-label="Comprar rápido">
      <div class="sticky-left">
        <div class="sticky-name">${safe(p.name)}</div>
        <div class="sticky-price">${brl(pixPrice)} <small>Pix</small></div>
      </div>
      <button class="sticky-btn" id="stickyBtn" type="button">Comprar</button>
    </div>
  `;

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  const panes = document.querySelectorAll(".pane");
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const key = t.dataset.tab;
      panes.forEach((pn) => pn.classList.toggle("active", pn.dataset.pane === key));
    });
  });

  // Qty controls
  const qtyInput = document.getElementById("qtyInput");
  const minus = document.getElementById("qtyMinus");
  const plus = document.getElementById("qtyPlus");

  function getQty() {
    const q = Math.max(1, Number(qtyInput?.value || 1));
    if (qtyInput) qtyInput.value = String(q);
    return q;
  }

  minus?.addEventListener("click", () => {
    const q = Math.max(1, getQty() - 1);
    qtyInput.value = String(q);
  });
  plus?.addEventListener("click", () => {
    const q = getQty() + 1;
    qtyInput.value = String(q);
  });
  qtyInput?.addEventListener("blur", () => getQty());

  // Comprar
  const buyBtn = document.getElementById("buyBtn");
  buyBtn?.addEventListener("click", () => {
    const qty = getQty();
    addWithQty({ ...p, image: mainImg }, qty, pixPrice);
  });

  // Sticky buy (mobile)
  const stickyBtn = document.getElementById("stickyBtn");
  stickyBtn?.addEventListener("click", () => {
    const qty = getQty();
    addWithQty({ ...p, image: mainImg }, qty, pixPrice);
  });

  // WhatsApp do produto
  const whatsBtn = document.getElementById("whatsBtn");
  const phone = getWhatsappNumber();
  function syncWhatsapp() {
    const qty = getQty();
    const text = buildWhatsappMessage({ ...p, id: p.id }, qty, pixPrice);
    whatsBtn.href = `https://wa.me/${phone}?text=${text}`;
  }
  syncWhatsapp();
  qtyInput?.addEventListener("input", syncWhatsapp);
  minus?.addEventListener("click", syncWhatsapp);
  plus?.addEventListener("click", syncWhatsapp);

  // Search do topo -> manda pro catálogo
  const searchTop = document.getElementById("searchProductTop");
  if (searchTop) {
    searchTop.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = searchTop.value.trim();
        sessionStorage.setItem("q", q);
        location.href = "catalogo.html";
      }
    });
  }

  // Esconde sticky quando estiver muito no topo (fica mais elegante)
  const sticky = document.getElementById("stickyBuy");
  function stickyLogic() {
    if (!sticky) return;
    const y = window.scrollY || 0;
    sticky.classList.toggle("show", y > 220);
  }
  window.addEventListener("scroll", stickyLogic, { passive: true });
  stickyLogic();
}

async function renderRelated(currentId) {
  try {
    let all = await getAllProducts();
    all = all.filter((p) => p.id !== currentId);
    all.sort(() => Math.random() - 0.5);
    const picks = all.slice(0, 8);

    if (!picks.length) {
      relatedGrid.innerHTML = `<p class="muted">Sem recomendações por enquanto.</p>`;
      return;
    }

    relatedGrid.innerHTML = "";
    picks.forEach((p) => {
      const price = Number(p.price || 0);
      const pixPrice = p.pixPrice ? Number(p.pixPrice) : calcPixPrice(price);
      const rating = p.rating ?? 4.8;
      const reviews = p.reviews ?? Math.floor(25 + Math.random() * 120);

      relatedGrid.innerHTML += `
        <article class="card product-card">
          <a class="product-link" href="product.html?id=${p.id}" aria-label="Ver ${safe(p.name)}">
            <div class="product-media">
              <img src="${p.image || "https://via.placeholder.com/600x600?text=Produto"}" alt="${safe(p.name)}" loading="lazy" />
            </div>
            <h3 class="product-title">${safe(p.name)}</h3>
            <div class="rating">
              <span class="stars" aria-hidden="true">${stars(rating)}</span>
              <span class="count">(${reviews})</span>
            </div>
            <div class="price">
              <span class="pix">${brl(pixPrice)} no Pix</span>
            </div>
          </a>

          <div class="product-actions">
            <button
              class="btn-buy"
              type="button"
              onclick="addToCart('${escQuotes(p.name)}', '${pixPrice}', '${escQuotes(p.image || "")}'); toggleCart();"
            >
              Comprar
            </button>
          </div>
        </article>
      `;
    });
  } catch (e) {
    relatedGrid.innerHTML = `<p class="muted">Não foi possível carregar recomendações.</p>`;
  }
}

async function boot() {
  const id = getId();
  if (!id) {
    wrap.innerHTML = `<p class="muted">Produto não encontrado. Volte ao <a href="catalogo.html">catálogo</a>.</p>`;
    return;
  }

  const p = await getProductById(id);
  if (!p) {
    wrap.innerHTML = `<p class="muted">Produto não encontrado. Volte ao <a href="catalogo.html">catálogo</a>.</p>`;
    return;
  }

  renderProduct(p);
  renderRelated(id);
}

boot();
