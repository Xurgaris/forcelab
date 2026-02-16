import { getFeaturedProducts } from "./productsFirebase.js";

const grid = document.getElementById("productsGrid");

function brl(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcOldPrice(price) {
  return Number(price) * 1.18; // +18% (sensação de promo)
}
function calcPixPrice(price) {
  return Number(price) * 0.93; // -7% no Pix
}
function calcInstallments(price, n = 3) {
  return Number(price / n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function stars(rating = 4.8) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

async function loadFeatured() {
  grid.innerHTML = `<p class="muted">Carregando produtos...</p>`;

  let products = await getFeaturedProducts();

  // Filtro por busca (sessionStorage)
 // Filtro por busca (sessionStorage) — nome + tags + categoria
const q = (sessionStorage.getItem("q") || "").trim().toLowerCase();

if (q) {
  products = products.filter((p) => {
    const name = String(p.name || "").toLowerCase();

    // tenta pegar tags em vários formatos
    const tagsArr =
      Array.isArray(p.tags) ? p.tags :
      Array.isArray(p.keywords) ? p.keywords :
      (typeof p.tags === "string" ? p.tags.split(",") : []);

    const tagSingle =
      p.tag ?? p.categoria ?? p.category ?? p.type ?? "";

    const tagsText = [
      ...tagsArr.map(t => String(t).toLowerCase().trim()),
      String(tagSingle).toLowerCase().trim()
    ].filter(Boolean).join(" ");

    // (opcional) descrição
    const desc = String(p.description || p.desc || "").toLowerCase();

    return (
      name.includes(q) ||
      tagsText.includes(q) ||
      desc.includes(q)
    );
  });
}


  grid.innerHTML = "";

  products.forEach((p) => {
    const price = Number(p.price || 0);
    const oldPrice = p.oldPrice ? Number(p.oldPrice) : calcOldPrice(price);
    const pixPrice = p.pixPrice ? Number(p.pixPrice) : calcPixPrice(price);

    const rating = p.rating ?? 4.8;
    const reviews = p.reviews ?? Math.floor(25 + Math.random() * 120);
    const installmentsN = p.installments ?? 3;

    const safeName = String(p.name || "").replace(/'/g, "\\'");
    const safeImg = String(p.image || "").replace(/'/g, "\\'");

    grid.innerHTML += `
      <article class="card product-card">
        <a class="product-link" href="product.html?id=${p.id}" aria-label="Ver ${safeName}">
          <div class="product-media">
            <img src="${p.image}" alt="${safeName}" loading="lazy" />
          </div>

          <h3 class="product-title">${p.name}</h3>

          <div class="rating">
            <span class="stars" aria-hidden="true">${stars(rating)}</span>
            <span class="count">(${reviews})</span>
          </div>

          <div class="price">
            <span class="from">${brl(oldPrice)}</span>
            <span class="pix">${brl(pixPrice)} no Pix</span>
            <span class="installments">
              ou ${brl(price)} em ${installmentsN}x de ${calcInstallments(price, installmentsN)} sem juros
            </span>
          </div>
        </a>

        <div class="product-actions">
          <button
            class="btn-buy"
            type="button"
            onclick="addToCart('${safeName}', ${pixPrice}, '${safeImg}'); toggleCart();"
          >
            Comprar
          </button>
        </div>
      </article>
    `;
  });
}

loadFeatured();
window.addEventListener("productSearch", loadFeatured);
