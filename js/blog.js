// /js/blog.js
import { POSTS } from "./posts.js";

const posts = POSTS.slice();

const elGrid = document.getElementById("blogGrid");
const elCat = document.getElementById("blogCategory");
const elSearch = document.getElementById("blogSearch");
const elSort = document.getElementById("blogSort");

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function cardHTML(p) {
  return `
  <article class="blog-card">
    <a class="blog-media" href="artigo.html?slug=${encodeURIComponent(p.slug)}">
      <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <span class="blog-tag ${p.hot ? "blog-tag--hot" : ""}">${escapeHtml(p.tag)}</span>
    </a>
    <div class="blog-body">
      <div class="blog-meta">
        <span>${escapeHtml(p.category)}</span><span class="dot">•</span><span>${escapeHtml(p.readTime)}</span><span class="dot">•</span>
        <time datetime="${escapeHtml(p.dateISO)}">${escapeHtml(p.dateLabel)}</time>
      </div>
      <h3 class="blog-title">
        <a href="artigo.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>
      </h3>
      <p class="blog-excerpt">${escapeHtml(p.excerpt)}</p>
      <div class="blog-actions">
        <a class="btn btn-ghost" href="artigo.html?slug=${encodeURIComponent(p.slug)}">Ler artigo</a>
        <a class="btn btn-primary" href="catalogo.html">Ver produtos</a>
      </div>
    </div>
  </article>`;
}

function render() {
  const q = (elSearch?.value || "").trim().toLowerCase();
  const cat = elCat?.value || "all";
  const sort = elSort?.value || "new";

  let list = posts.slice();

  if (cat !== "all") list = list.filter((p) => p.category === cat);

  if (q) {
    list = list.filter((p) =>
      (p.title + " " + p.excerpt + " " + p.category + " " + p.tag)
        .toLowerCase()
        .includes(q)
    );
  }

  if (sort === "hot") list.sort((a, b) => (b.hot === true) - (a.hot === true));
  else list.sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));

  if (elGrid) elGrid.innerHTML = list.map(cardHTML).join("");
}

function fillCategories() {
  const cats = Array.from(new Set(posts.map((p) => p.category))).sort();
  if (!elCat) return;
  elCat.innerHTML =
    `<option value="all">Todas categorias</option>` +
    cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

fillCategories();
render();

elSearch?.addEventListener("input", render);
elCat?.addEventListener("change", render);
elSort?.addEventListener("change", render);
