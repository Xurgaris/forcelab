import { db } from "/js/firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
// ===============================
// CLOUDINARY (UPLOAD)
// ===============================
const CLOUD_NAME = "dhpjlsgch";
const UPLOAD_PRESET = "produtos_unsigned";
const CLOUD_FOLDER = "produtos"; // opcional (organiza numa pasta)

const tbody = document.getElementById("productsTbody");
const countEl = document.getElementById("productsCount");

const searchInput = document.getElementById("productsSearch");
const filterFeatured = document.getElementById("filterFeatured");
const sortProducts = document.getElementById("sortProducts");
const btnClear = document.getElementById("btnClear");
const btnRefresh = document.getElementById("btnRefresh");
const btnNew = document.getElementById("btnNew");

// modal
const modal = document.getElementById("productModal");
const pTitle = document.getElementById("pTitle");
const pSub = document.getElementById("pSub");
const pMsg = document.getElementById("pMsg");

const form = document.getElementById("productForm");
const pName = document.getElementById("pName");
const pPrice = document.getElementById("pPrice");
const pOldPrice = document.getElementById("pOldPrice");
const pPixPrice = document.getElementById("pPixPrice");
const pInstallments = document.getElementById("pInstallments");
const pFeatured = document.getElementById("pFeatured");
const pImage = document.getElementById("pImage");
const pCategory = document.getElementById("pCategory");
const pDescription = document.getElementById("pDescription");
const pPreviewBox = document.getElementById("pPreviewBox");
const pImageFile = document.getElementById("pImageFile");
const btnUploadImg = document.getElementById("btnUploadImg");
const pUploadMsg = document.getElementById("pUploadMsg");

const btnDelete = document.getElementById("btnDelete");
const btnSave = document.getElementById("btnSave");

let PRODUCTS = [];
let CURRENT_ID = null;

function brl(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function toNum(v) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function openModal(open) {
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  if (!open) {
    CURRENT_ID = null;
    pMsg.textContent = "";
  }
}

function setPreview(url) {
  const u = String(url || "").trim();
  if (!u) {
    pPreviewBox.innerHTML = "🖼️";
    return;
  }
  pPreviewBox.innerHTML = `<img src="${escapeHtml(u)}" alt="Preview" />`;
}
function setUploadMsg(msg, ok = true) {
  if (!pUploadMsg) return;
  pUploadMsg.textContent = msg || "";
  pUploadMsg.style.color = ok
    ? "rgba(170,255,200,.95)"
    : "rgba(255,170,170,.95)";
}

// Preview ao escolher arquivo do PC
pImageFile?.addEventListener("change", () => {
  const file = pImageFile.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setUploadMsg("O arquivo precisa ser uma imagem.", false);
    pImageFile.value = "";
    return;
  }

  const localUrl = URL.createObjectURL(file);
  setPreview(localUrl);
  setUploadMsg("Arquivo selecionado. Clique em “Enviar imagem”.", true);
});

async function uploadSelectedImage() {
  const file = pImageFile?.files?.[0];
  if (!file) {
    setUploadMsg("Selecione uma imagem do PC primeiro.", false);
    return;
  }

  if (!file.type.startsWith("image/")) {
    setUploadMsg("O arquivo precisa ser uma imagem.", false);
    return;
  }

  // limite opcional (ajuste se quiser)
  if (file.size > 6 * 1024 * 1024) {
    setUploadMsg("Imagem muito grande (máx 6MB).", false);
    return;
  }

  btnUploadImg.disabled = true;
  setUploadMsg("Enviando para Cloudinary...", true);

  try {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    // opcional: organizar em pasta + nomes
    formData.append("folder", CLOUD_FOLDER);
    // se quiser forçar nome único:
    // formData.append("unique_filename", "true");

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload falhou (${res.status}). ${text}`);
    }

    const data = await res.json();

    // URL final da imagem
    const finalUrl = data.secure_url || data.url;
    if (!finalUrl) throw new Error("Cloudinary não retornou a URL da imagem.");

    // joga URL no input (isso é o que salva no Firestore)
    pImage.value = finalUrl;
    setPreview(finalUrl);

    setUploadMsg("Upload concluído ✅ (URL preenchida no campo Imagem)", true);

    // opcional: limpa o input file
    // pImageFile.value = "";
  } catch (err) {
    console.error(err);
    setUploadMsg("Falha no upload. Verifique preset (Unsigned) e permissões.", false);
  } finally {
    btnUploadImg.disabled = false;
  }
}

btnUploadImg?.addEventListener("click", uploadSelectedImage);

function resetForm() {
  form.reset();
  pDescription.value = "";
  pCategory.value = "";
  setPreview("");
  if (pImageFile) pImageFile.value = "";
  if (pUploadMsg) pUploadMsg.textContent = "";
}

function fillForm(p) {
  pName.value = p.name || "";
  pPrice.value = p.price ?? "";
  pOldPrice.value = p.oldPrice ?? "";
  pPixPrice.value = p.pixPrice ?? "";
  pInstallments.value = p.installments ?? "";
  pFeatured.checked = !!p.featured;
  pImage.value = p.image || "";
  pCategory.value = p.category || "";
  pDescription.value = p.description || "";
  setPreview(p.image || "");
  if (pImageFile) pImageFile.value = "";
  if (pUploadMsg) pUploadMsg.textContent = "";
}

async function fetchProducts() {
  console.log("DB =>", db);
console.log("DB type =>", typeof db);

  const snap = await getDocs(collection(db, "produtos"));
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  PRODUCTS = list;
}

function applyFilters() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const feat = filterFeatured.value;
  const sort = sortProducts.value;

  let rows = [...PRODUCTS];

  if (q) {
    rows = rows.filter((p) =>
      String(p.name || "")
        .toLowerCase()
        .includes(q),
    );
  }

  if (feat === "featured") rows = rows.filter((p) => !!p.featured);
  if (feat === "not-featured") rows = rows.filter((p) => !p.featured);

  rows.sort((a, b) => {
    const an = String(a.name || "").toLowerCase();
    const bn = String(b.name || "").toLowerCase();
    const ap = toNum(a.price);
    const bp = toNum(b.price);

    if (sort === "name-asc") return an.localeCompare(bn);
    if (sort === "name-desc") return bn.localeCompare(an);
    if (sort === "price-asc") return ap - bp;
    if (sort === "price-desc") return bp - ap;
    return 0;
  });

  countEl.textContent = rows.length;
  renderTable(rows);
}

function renderTable(rows) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((p) => {
      const img = p.image
        ? `<img class="pimg" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`
        : "";
      const feat = p.featured
        ? `<span class="badge ok">sim</span>`
        : `<span class="badge wait">não</span>`;

      return `
      <tr>
        <td>
          <div class="pinfo">
            <div class="pimgwrap">${img || "🧃"}</div>
            <div>
              <strong>${escapeHtml(p.name || "Produto")}</strong>
              <div class="muted small">${escapeHtml(p.category || "sem categoria")}</div>
            </div>
          </div>
        </td>

        <td>
          <div><strong>${brl(p.price)}</strong></div>
          <div class="muted small">${p.pixPrice ? `Pix: ${brl(p.pixPrice)}` : ""}</div>
        </td>

        <td>${feat}</td>

        <td class="actions">
          <button class="btn-mini" data-edit="${p.id}" type="button">Editar</button>
          <button class="btn-mini ghost" data-toggle="${p.id}" type="button">
            ${p.featured ? "Remover destaque" : "Destacar"}
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openEdit(btn.dataset.edit));
  });

  tbody.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => toggleFeatured(btn.dataset.toggle));
  });
}

function openNew() {
  CURRENT_ID = null;
  resetForm();
  pTitle.textContent = "Novo produto";
  pSub.textContent = "Preencha os campos e salve";
  btnDelete.style.display = "none";
  openModal(true);
}

function openEdit(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  CURRENT_ID = id;
  fillForm(p);
  pTitle.textContent = "Editar produto";
  pSub.textContent = `ID: ${id}`;
  btnDelete.style.display = "inline-flex";
  openModal(true);
}

async function toggleFeatured(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  try {
    await updateDoc(doc(db, "produtos", id), {
      featured: !p.featured,
      updatedAt: new Date(),
    });
    p.featured = !p.featured;
    applyFilters();
  } catch (err) {
    console.error(err);
    alert("Sem permissão ou erro ao atualizar destaque.");
  }
}

async function saveProduct(e) {
  e.preventDefault();
  pMsg.textContent = "";

  const payload = {
    name: String(pName.value || "").trim(),
    price: toNum(pPrice.value),
    image: String(pImage.value || "").trim(),
    featured: !!pFeatured.checked,
    category: String(pCategory.value || "").trim(),
    description: String(pDescription.value || "").trim(),
  };

  // opcionais
  const oldPrice = String(pOldPrice.value || "").trim();
  const pixPrice = String(pPixPrice.value || "").trim();
  const installments = String(pInstallments.value || "").trim();

  if (oldPrice) payload.oldPrice = toNum(oldPrice);
  else payload.oldPrice = null;

  if (pixPrice) payload.pixPrice = toNum(pixPrice);
  else payload.pixPrice = null;

  if (installments)
    payload.installments = Math.max(1, Math.min(12, Number(installments) || 3));
  else payload.installments = null;

  if (!payload.name || !payload.image || !payload.price) {
    pMsg.textContent = "Preencha nome, imagem e preço.";
    return;
  }

  btnSave.disabled = true;
  pMsg.textContent = "Salvando...";

  try {
    if (CURRENT_ID) {
      await updateDoc(doc(db, "produtos", CURRENT_ID), {
        ...payload,
        updatedAt: new Date(),
      });

      const idx = PRODUCTS.findIndex((x) => x.id === CURRENT_ID);
      if (idx >= 0) PRODUCTS[idx] = { ...PRODUCTS[idx], ...payload };

      pMsg.textContent = "Atualizado ✅";
    } else {
      const ref = await addDoc(collection(db, "produtos"), {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      PRODUCTS.unshift({ id: ref.id, ...payload });
      pMsg.textContent = "Criado ✅";
    }

    applyFilters();
    setTimeout(() => openModal(false), 700);
  } catch (err) {
    console.error(err);
    pMsg.textContent = "Sem permissão ou erro ao salvar.";
  } finally {
    btnSave.disabled = false;
  }
}

async function deleteProduct() {
  if (!CURRENT_ID) return;
  const ok = confirm("Excluir este produto? Isso não pode ser desfeito.");
  if (!ok) return;

  btnDelete.disabled = true;
  pMsg.textContent = "Excluindo...";

  try {
    await deleteDoc(doc(db, "produtos", CURRENT_ID));
    PRODUCTS = PRODUCTS.filter((p) => p.id !== CURRENT_ID);
    applyFilters();
    openModal(false);
  } catch (err) {
    console.error(err);
    pMsg.textContent = "Sem permissão ou erro ao excluir.";
  } finally {
    btnDelete.disabled = false;
  }
}

/* binds */
btnNew?.addEventListener("click", openNew);
btnRefresh?.addEventListener("click", async () => {
  tbody.innerHTML = `<tr><td colspan="4" class="muted">Atualizando...</td></tr>`;
  await boot();
});

btnClear?.addEventListener("click", () => {
  searchInput.value = "";
  filterFeatured.value = "all";
  sortProducts.value = "name-asc";
  applyFilters();
});

searchInput?.addEventListener("input", applyFilters);
filterFeatured?.addEventListener("change", applyFilters);
sortProducts?.addEventListener("change", applyFilters);

pImage?.addEventListener("input", () => setPreview(pImage.value));
form?.addEventListener("submit", saveProduct);
btnDelete?.addEventListener("click", deleteProduct);

// close modal
modal?.addEventListener("click", (e) => {
  const el = e.target;
  if (el?.dataset?.close) openModal(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openModal(false);
});

async function boot() {
  await fetchProducts();
  applyFilters();
}
boot();
