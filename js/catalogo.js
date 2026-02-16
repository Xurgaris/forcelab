import { getAllProducts } from "./productsFirebase.js";

const grid = document.getElementById("catalogGrid");
const chipsWrap = document.getElementById("catalogChips");
const searchInput = document.getElementById("catalogSearch");
const sortSelect = document.getElementById("sortSelect");
const priceMaxInput = document.getElementById("priceMax");
const resultCount = document.getElementById("resultCount");
const pagination = document.getElementById("pagination");
const clearBtn = document.getElementById("clearFilters");

const PAGE_SIZE = 12;

// ---------- Utils ----------
function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[-_/]/g, " ")          // pre-treino -> pre treino
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return norm(s).split(" ").filter(Boolean);
}

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function getTagsText(p) {
  const tagsArr =
    Array.isArray(p.tags) ? p.tags :
    Array.isArray(p.keywords) ? p.keywords :
    (typeof p.tags === "string" ? p.tags.split(",") : []);

  const tagSingle = p.tag ?? p.categoria ?? p.category ?? p.type ?? "";

  return norm([...tagsArr, tagSingle].filter(Boolean).join(" "));
}

function matchAllTokens(haystack, q) {
  const h = norm(haystack);
  const qs = tokens(q);
  if (!qs.length) return true;
  return qs.every(t => h.includes(t));
}

// ---------- UI ----------
function renderChips(activeTag) {
  const base = [
    { label: "Todos", tag: "" },
    { label: "Creatina", tag: "creatina" },
    { label: "Proteínas", tag: "proteinas" },
    { label: "Pré-treino", tag: "pre treino" },
    { label: "Massa", tag: "massa" },
    { label: "Força", tag: "forca" },
    { label: "Energia", tag: "energia" },
    { label: "Saúde", tag: "saude" },
  ];

  chipsWrap.innerHTML = "";
  base.forEach(item => {
    const a = document.createElement("a");
    const isActive = norm(activeTag) === norm(item.tag);

    a.className = "chip" + (isActive ? " chip--active" : "");
    a.href = item.tag ? `catalogo.html?tag=${encodeURIComponent(item.tag)}` : "catalogo.html";
    a.textContent = item.label;

    chipsWrap.appendChild(a);
  });
}

function sortProducts(list, mode) {
  const arr = [...list];
  switch (mode) {
    case "price-asc": return arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    case "price-desc": return arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    case "name-asc": return arr.sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
    case "name-desc": return arr.sort((a, b) => norm(b.name).localeCompare(norm(a.name)));
    default: return arr; // featured (mantém ordem original)
  }
}

function productCard(p) {
  const price = Number(p.price || 0);
  const pixPrice = p.pixPrice ? Number(p.pixPrice) : price * 0.93;

  const safeName = String(p.name || "Produto").replace(/'/g, "\\'");
  const safeImg = String(p.image || "https://via.placeholder.com/400").replace(/'/g, "\\'");

  return `
    <article class="card product-card">
      <a class="product-link" href="product.html?id=${p.id}" aria-label="Ver ${safeName}">
        <div class="product-media">
          <img src="${p.image || "https://via.placeholder.com/400"}" alt="${safeName}" loading="lazy" />
        </div>

        <h3 class="product-title">${p.name || "Produto"}</h3>

        <div class="price">
          <span class="pix">${brl(pixPrice)} no Pix</span>
          <span class="installments">ou ${brl(price)} em 3x de ${brl(price / 3)} sem juros</span>
        </div>
      </a>

      <div class="product-actions">
        <button class="btn-buy" type="button"
          onclick="addToCart('${safeName}', ${pixPrice}, '${safeImg}'); toggleCart();">
          Comprar
        </button>
      </div>
    </article>
  `;
}

function renderPagination(total, page, onChange) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  pagination.innerHTML = "";
  if (pages <= 1) return;

  // compacto: mostra até 7 botões (1 ... 4 5 6 ... last)
  const makeBtn = (n, active = false, label = null) => {
    const b = document.createElement("button");
    b.className = "page-btn" + (active ? " active" : "");
    b.textContent = label ?? String(n);
    b.onclick = () => onChange(n);
    return b;
  };

  const addDots = () => {
    const s = document.createElement("span");
    s.style.opacity = ".6";
    s.style.fontWeight = "900";
    s.textContent = "…";
    pagination.appendChild(s);
  };

  pagination.appendChild(makeBtn(1, page === 1));

  if (pages <= 7) {
    for (let i = 2; i <= pages; i++) pagination.appendChild(makeBtn(i, page === i));
    return;
  }

  if (page > 3) addDots();

  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  for (let i = start; i <= end; i++) pagination.appendChild(makeBtn(i, page === i));

  if (page < pages - 2) addDots();

  pagination.appendChild(makeBtn(pages, page === pages));
}

// ---------- Main ----------
let allProducts = [];
let currentPage = 1;

function applyFilters() {
  const q = (searchInput?.value || sessionStorage.getItem("q") || "").trim();
  const tag = (getQueryParam("tag") || "").trim();
  const max = Number(priceMaxInput?.value || 0);
  const sortMode = sortSelect?.value || "featured";

  let list = [...allProducts];

  // busca: exige todas as palavras (mais “loja real”)
  if (q) {
    list = list.filter(p => {
      const hay = [
        p.name,
        p.description || p.desc || "",
        getTagsText(p),
      ].join(" ");
      return matchAllTokens(hay, q);
    });
  }

  // tag via URL
  if (tag) {
    list = list.filter(p => {
      const hay = [p.name, getTagsText(p)].join(" ");
      return matchAllTokens(hay, tag);
    });
  }

  // preço máximo
  if (max > 0) list = list.filter(p => Number(p.price || 0) <= max);

  // ordenação
  list = sortProducts(list, sortMode);

  return { list, q, tag };
}

function render() {
  const { list } = applyFilters();

  resultCount.textContent = String(list.length);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, pages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = list.slice(start, start + PAGE_SIZE);

  grid.innerHTML = slice.length
    ? slice.map(productCard).join("")
    : `<p class="muted">Nenhum produto encontrado com esses filtros.</p>`;

  renderPagination(list.length, currentPage, (p) => {
    currentPage = p;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

async function loadCatalog() {
  grid.innerHTML = `<p class="muted">Carregando catálogo...</p>`;

  allProducts = await getAllProducts();

  // chips pelo ?tag=
  const tag = getQueryParam("tag") || "";
  renderChips(tag);

  // se veio busca salva, preenche input
  const qSaved = sessionStorage.getItem("q");
  if (searchInput && qSaved && !searchInput.value) searchInput.value = qSaved;

  currentPage = 1;
  render();
}

// Events
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sessionStorage.setItem("q", searchInput.value.trim());
    currentPage = 1;
    render();
  }
});

sortSelect?.addEventListener("change", () => { currentPage = 1; render(); });
priceMaxInput?.addEventListener("change", () => { currentPage = 1; render(); });

clearBtn?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  if (priceMaxInput) priceMaxInput.value = "";
  sessionStorage.setItem("q", "");
  history.replaceState({}, "", "catalogo.html");
  renderChips("");
  currentPage = 1;
  render();
});

loadCatalog();
