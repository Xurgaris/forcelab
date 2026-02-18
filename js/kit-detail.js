import { getKit } from "./kits-data.js";

function brl(v){
  return Number(v||0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}
function calcPix(price){
  // mesmo padrão que você usa nos produtos (se quiser ajustar, muda aqui)
  return Number(price||0) * 0.93;
}

const wrap = document.getElementById("kitDetail");
const id = new URLSearchParams(location.search).get("id");
const kit = getKit(id);

if (!wrap){
  console.warn("❌ kitDetail não encontrado no HTML");
} else if (!id){
  wrap.innerHTML = `<p class="muted">ID do kit não informado na URL.</p>`;
} else if (!kit){
  wrap.innerHTML = `<p class="muted">Kit não encontrado: <strong>${id}</strong></p>`;
} else {
  // conteúdo extra (fallbacks)
  const long =
    kit.longDesc ||
    "Combinação pronta para facilitar sua rotina. Ideal para quem quer resultado com consistência, sem perder tempo montando a compra item por item.";

  const benefits = kit.benefits || [
    "Compra rápida e econômica (custo-benefício)",
    "Rotina mais simples (combo pronto)",
    "Perfeito para consistência no mês",
  ];

  const bullets = kit.bullets || [];
  const pixPrice = calcPix(kit.price);

  wrap.innerHTML = `
    <section class="kit-page">
      <a class="kit-back" href="/" aria-label="Voltar">← Voltar</a>

      <div class="kit-hero">
        <div class="kit-media">
          <img src="${kit.image}" alt="${kit.name}">
          <div class="kit-tags">
            ${kit.badge ? `<span class="kit-tag">${kit.badge}</span>` : ``}
            ${kit.off ? `<span class="kit-tag danger">${kit.off}</span>` : ``}
          </div>
        </div>

        <div class="kit-info">
          <h1 class="kit-title">${kit.name}</h1>
          <p class="kit-desc">${kit.desc || ""}</p>

          <div class="kit-prices">
            ${kit.oldPrice ? `<span class="kit-old">${brl(kit.oldPrice)}</span>` : ``}
            <span class="kit-new">${brl(kit.price)}</span>
            <span class="kit-pix">no Pix: <strong>${brl(pixPrice)}</strong></span>
          </div>

          <div class="kit-actions">
            <button id="btnAddKit" class="btn btn-primary" type="button">Adicionar kit</button>
            <button id="btnBuyKit" class="btn btn-ghost" type="button">Comprar agora</button>
          </div>

          <div class="kit-meta">
            <div class="meta-card">
              <strong>Envio rápido</strong>
              <span class="muted">Despacho organizado e rastreio</span>
            </div>
            <div class="meta-card">
              <strong>Pagamento seguro</strong>
              <span class="muted">Pix e cartão com checkout otimizado</span>
            </div>
            <div class="meta-card">
              <strong>Suporte</strong>
              <span class="muted">Dúvidas e acompanhamento</span>
            </div>
          </div>
        </div>
      </div>

      <div class="kit-grid">
        <article class="kit-panel">
          <h3>Descrição completa</h3>
          <p class="muted">${long}</p>
        </article>

        <article class="kit-panel">
          <h3>O que vem no kit</h3>
          <ul class="kit-list">
            ${bullets.map(x => `<li>${x}</li>`).join("")}
          </ul>
        </article>

        <article class="kit-panel">
          <h3>Por que esse kit?</h3>
          <ul class="kit-benefits">
            ${benefits.map(x => `<li>${x}</li>`).join("")}
          </ul>
        </article>
      </div>
    </section>
  `;

  // ✅ Botões funcionando
  const add = document.getElementById("btnAddKit");
  const buy = document.getElementById("btnBuyKit");

  add.addEventListener("click", () => {
    if (typeof window.addToCartQty !== "function"){
      alert("Carrinho não carregou. Verifique se o script do carrinho está nesta página.");
      return;
    }
    window.addToCartQty(kit.name, kit.price, kit.image, 1, { type:"kit", id: kit.id });
    window.location.href = "./cart.html";
  });

  buy.addEventListener("click", () => {
    if (typeof window.addToCartQty !== "function"){
      alert("Carrinho não carregou. Verifique se o script do carrinho está nesta página.");
      return;
    }
    window.addToCartQty(kit.name, kit.price, kit.image, 1, { type:"kit", id: kit.id });
    // se você tiver checkout, troca aqui
    window.location.href = "/checkout.html";
  });
}
