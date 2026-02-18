import { listPosts } from "./blogFirebase.js";

const grid = document.getElementById("blogGrid");

function card(p){
  return `
    <article class="blog-card">
      <a class="blog-card-media" href="/artigo.html?slug=${encodeURIComponent(p.slug)}">
        <img src="${p.cover}" alt="${p.title}" loading="lazy"/>
        <span class="blog-pill">${(p.tags?.[0] || "Artigo")}</span>
      </a>
      <div class="blog-card-body">
        <h3>${p.title}</h3>
        <p class="muted">${p.excerpt || ""}</p>
        <div class="blog-card-foot">
          <span class="muted">${p.category || ""}</span>
          <a class="blog-link" href="/artigo.html?slug=${encodeURIComponent(p.slug)}">Ler artigo</a>
        </div>
      </div>
    </article>
  `;
}

(async function(){
  const posts = await listPosts({ status: "published" });
  grid.innerHTML = posts.map(card).join("") || `<p class="muted">Sem posts ainda.</p>`;
})();
