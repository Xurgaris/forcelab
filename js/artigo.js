// /js/artigo.js
import { POSTS } from "./posts.js";

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const slug = params.get("slug");

const hero = $("#postHero");
const content = $("#postContent");

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function buildAutoContent(p) {
  // conteúdo “genérico bom” pra posts gerados
  return [
    { h2: "Visão geral", p: p.excerpt || "Um guia rápido e direto para te ajudar na decisão." },
    { h2: "Como aplicar na prática", list: [
      "Escolha 1 ajuste por vez na rotina",
      "Mantenha por 7–14 dias e observe",
      "Registre treino, sono e alimentação (o básico)",
    ]},
    { h2: "Erros comuns", list: [
      "Tentar mudar tudo ao mesmo tempo",
      "Comparar resultados de semanas com expectativas de dias",
      "Ignorar sono e consistência",
    ]},
    { h2: "Recomendação final", p: "Se quiser, use produtos como ferramenta — mas priorize rotina e constância." },
  ];
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

function miniHTML(p) {
  return `
    <a class="mini" href="artigo.html?slug=${encodeURIComponent(p.slug)}">
      <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <div>
        <strong>${escapeHtml(p.title)}</strong>
        <small>${escapeHtml(p.category)} • ${escapeHtml(p.readTime)}</small>
      </div>
    </a>
  `;
}

function renderNotFound() {
  document.title = "Artigo não encontrado | ForceLab";
  hero.innerHTML = `
    <div>
      <h1>Artigo não encontrado</h1>
      <p class="muted">Esse conteúdo não existe (ou o link está errado).</p>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
        <a class="btn btn-primary" href="blog.html">Voltar ao blog</a>
        <a class="btn btn-ghost" href="index.html">Ir para a loja</a>
      </div>
    </div>
    <div class="cover"></div>
  `;
  content.innerHTML = `<p>Verifique o link ou escolha um artigo no blog.</p>`;
}

function renderPost(p) {
  document.title = `${p.title} | ForceLab`;

  hero.innerHTML = `
    <div>
      <h1>${escapeHtml(p.title)}</h1>
      <p>${escapeHtml(p.excerpt)}</p>
      <div class="meta">
        <span>${escapeHtml(p.category)}</span>
        <span class="dot">•</span>
        <span>${escapeHtml(p.readTime)}</span>
        <span class="dot">•</span>
        <time datetime="${escapeHtml(p.dateISO)}">${escapeHtml(p.dateLabel)}</time>
      </div>

      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
        <a class="btn btn-primary" href="catalogo.html">Ver produtos</a>
        <a class="btn btn-ghost" href="blog.html">Voltar ao blog</a>
      </div>
    </div>

    <div class="cover">
      <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
    </div>
  `;

  // side info
  $("#sideCategory").textContent = p.category || "—";
  $("#sideRead").textContent = p.readTime || "—";
  $("#sideDate").textContent = p.dateLabel || "—";

  const blocksData = (p.content && p.content.length) ? p.content : buildAutoContent(p);

  const blocks = blocksData.map((b) => {
    let html = "";
    if (b.h2) html += `<h2>${escapeHtml(b.h2)}</h2>`;
    if (b.p) html += `<p>${escapeHtml(b.p)}</p>`;
    if (Array.isArray(b.list)) html += `<ul>${b.list.map((li) => `<li>${escapeHtml(li)}</li>`).join("")}</ul>`;
    return html;
  }).join("");

  content.innerHTML = blocks;

  // related
  const related = POSTS
    .filter((x) => x.slug !== p.slug)
    .sort((a, b) => (b.hot === true) - (a.hot === true))
    .slice(0, 6);

  $("#relatedGrid").innerHTML = related.map(cardHTML).join("");
  $("#relatedMini").innerHTML = related.slice(0, 3).map(miniHTML).join("");
}

const post = POSTS.find((p) => p.slug === slug);
if (!slug || !post) renderNotFound();
else renderPost(post);
