import { listPostsAdmin, removePost, updatePost } from "../../js/blogFirebase.js";

const tbody = document.getElementById("postsTbody");

function fmtDate(ts){
  // Firestore Timestamp -> Date
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR");
}

function badge(status){
  if (status === "published") return `<span class="badge ok">publicado</span>`;
  return `<span class="badge wait">rascunho</span>`;
}

function row(p){
  return `
    <tr>
      <td>
        <strong>${p.title || "(Sem título)"}</strong><br/>
        <small class="muted">${p.slug || ""}</small>
      </td>
      <td>${badge(p.status)}</td>
      <td>${p.category || "-"}</td>
      <td>${fmtDate(p.updatedAt)}</td>
      <td style="text-align:right;">
        <div class="actions">
          <a class="btn-mini" href="/admin/blog-edit.html?id=${encodeURIComponent(p.id)}">Editar</a>
          ${
            p.status === "published"
            ? `<button class="btn-mini ghost" data-unpub="${p.id}">Despublicar</button>`
            : `<button class="btn-mini" data-pub="${p.id}">Publicar</button>`
          }
          <button class="btn-mini ghost" data-del="${p.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `;
}

async function load(){
  const posts = await listPostsAdmin();
  tbody.innerHTML = posts.map(row).join("") || `
    <tr><td colspan="5"><span class="muted">Nenhum post ainda.</span></td></tr>
  `;
}

tbody.addEventListener("click", async (e) => {
  const del = e.target.closest("[data-del]");
  const pub = e.target.closest("[data-pub]");
  const unpub = e.target.closest("[data-unpub]");

  if (del){
    const id = del.getAttribute("data-del");
    if (confirm("Excluir este post?")) {
      await removePost(id);
      load();
    }
  }

  if (pub){
    const id = pub.getAttribute("data-pub");
    await updatePost(id, { status: "published" });
    load();
  }

  if (unpub){
    const id = unpub.getAttribute("data-unpub");
    await updatePost(id, { status: "draft" });
    load();
  }
});

load();
