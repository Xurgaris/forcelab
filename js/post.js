import { POSTS, getPostById } from "./blogData.js";

const wrap = document.getElementById("postWrap");
const related = document.getElementById("relatedGrid");

const id = new URLSearchParams(location.search).get("id");
const post = getPostById(id);

function sectionHTML(block){
  if (block.h2) return `<h2>${block.h2}</h2><p>${block.p || ""}</p>`;
  return `<p>${block.p || ""}</p>`;
}

function card(p){
  return `
    <article class="blog-card">
      <a class="blog-card-media" href="/artigo.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.cover}" alt="${p.title}" loading="lazy" />
        <span class="blog-pill">${p.tag || "Artigo"}</span>
      </a>
      <div class="blog-card-body">
        <h3>${p.title}</h3>
        <p class="muted">${p.excerpt}</p>
        <div class="blog-card-foot">
          <span class="muted">${p.category || ""}</span>
          <a class="blog-link" href="/artigo.html?id=${encodeURIComponent(p.id)}">Ler artigo</a>
        </div>
      </div>
    </article>
  `;
}

if (!wrap){
  console.warn("postWrap não encontrado");
} else if (!post){
  wrap.innerHTML = `<p class="muted">Artigo não encontrado.</p>`;
} else {
  document.title = `${post.title} | Blog`;

  wrap.innerHTML = `
    <article class="post">
      <header class="post-head">
        <span class="post-tag">${post.tag || "Artigo"}</span>
        <h1>${post.title}</h1>
        <p class="muted">${post.excerpt}</p>
        <div class="post-meta">
          <span class="muted">${post.category || ""}</span>
          <span class="muted">${post.readingMinutes || 5} min</span>
        </div>
      </header>

      <div class="post-cover">
        <img src="${post.cover}" alt="${post.title}" />
      </div>

      <div class="post-body">
        ${(post.content || []).map(sectionHTML).join("")}
      </div>

      <div class="post-cta">
        <div>
          <strong>Quer uma rotina pronta?</strong>
          <p class="muted">Veja os kits em oferta e monte sua compra em poucos cliques.</p>
        </div>
        <a class="btn btn-primary" href="/#kits">Ver kits</a>
      </div>
    </article>
  `;

  const rel = POSTS
    .filter(p => p.id !== post.id)
    .filter(p => p.category === post.category)
    .sort((a,b)=> (b.views||0) - (a.views||0))
    .slice(0, 3);

  related.innerHTML = rel.map(card).join("");
}
