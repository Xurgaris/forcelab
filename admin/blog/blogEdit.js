import { createPost, updatePost, getPostById } from "../../js/blogFirebase.js";

const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
const postId = params.get("id");

const pageTitle = $("pageTitle");
const btnSave = $("btnSave");

function slugify(str){
  return (str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Markdown simples (sem libs)
function mdToHtml(md){
  const esc = (s) => s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  const lines = (md || "").split("\n");
  let out = [];
  for (const l of lines){
    if (l.startsWith("### ")) out.push(`<h3>${esc(l.slice(4))}</h3>`);
    else if (l.startsWith("## ")) out.push(`<h2>${esc(l.slice(3))}</h2>`);
    else if (l.startsWith("# ")) out.push(`<h1>${esc(l.slice(2))}</h1>`);
    else if (l.startsWith("- ")) out.push(`<li>${esc(l.slice(2))}</li>`);
    else if (l.trim() === "") out.push("");
    else out.push(`<p>${esc(l)}</p>`);
  }
  // agrupa <li> em <ul>
  const html = out.join("\n").replace(/(?:<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  return html;
}

function getPayload(){
  const title = $("title").value.trim();
  const slug = $("slug").value.trim() || slugify(title);

  return {
    title,
    slug,
    excerpt: $("excerpt").value.trim(),
    cover: $("cover").value.trim(),
    status: $("status").value,
    category: $("category").value.trim(),
    tags: $("tags").value.split(",").map(t => t.trim()).filter(Boolean),
    minutes: Number($("minutes").value || 5),
    contentMd: $("contentMd").value
  };
}

function updatePreview(){
  $("preview").innerHTML = mdToHtml($("contentMd").value);
}

$("title").addEventListener("input", () => {
  if (!postId) $("slug").value = slugify($("title").value);
});
$("contentMd").addEventListener("input", updatePreview);

async function load(){
  if (!postId) { updatePreview(); return; }
  pageTitle.textContent = "Editar post";

  const p = await getPostById(postId);
  if (!p) return;

  $("title").value = p.title || "";
  $("slug").value = p.slug || "";
  $("excerpt").value = p.excerpt || "";
  $("cover").value = p.cover || "";
  $("status").value = p.status || "draft";
  $("category").value = p.category || "";
  $("tags").value = (p.tags || []).join(", ");
  $("minutes").value = p.minutes || 5;
  $("contentMd").value = p.contentMd || "";
  updatePreview();
}

btnSave.addEventListener("click", async () => {
  const payload = getPayload();

  if (!payload.title) return alert("Coloque um título.");
  if (!payload.slug) return alert("Slug inválido.");

  if (postId){
    await updatePost(postId, payload);
    alert("Post atualizado ✅");
  } else {
    const newId = await createPost(payload);
    alert("Post criado ✅");
    location.href = `/admin/blog-edit.html?id=${encodeURIComponent(newId)}`;
  }
});

load();
