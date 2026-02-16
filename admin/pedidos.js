import { requireAuth } from "./auth.js";
import { loadSidebar } from "./sidebar-loader.js";
requireAuth();
await loadSidebar("pedidos");

import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const tbody = document.getElementById("ordersTbody");
const searchInput = document.getElementById("ordersSearch");
const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");
const countEl = document.getElementById("ordersCount");
const btnRefresh = document.getElementById("btnRefresh");
const btnClear = document.getElementById("btnClear");

// modal
const modal = document.getElementById("orderModal");
const mTitle = document.getElementById("mTitle");
const mSub = document.getElementById("mSub");
const mName = document.getElementById("mName");
const mEmail = document.getElementById("mEmail");
const mPhone = document.getElementById("mPhone");
const mAddress = document.getElementById("mAddress");
const mPay = document.getElementById("mPay");
const mStatus = document.getElementById("mStatus");
const mStatusBadge = document.getElementById("mStatusBadge");
const mItems = document.getElementById("mItems");
const mSubtotal = document.getElementById("mSubtotal");
const mDiscount = document.getElementById("mDiscount");
const mShipping = document.getElementById("mShipping");
const mTotal = document.getElementById("mTotal");
const mMeta = document.getElementById("mMeta");
const mMsg = document.getElementById("mMsg");
const btnSaveStatus = document.getElementById("btnSaveStatus");
const btnDeleteOrder = document.getElementById("btnDeleteOrder");

/**
 * Extras opcionais (se você criar no HTML, ele ativa):
 * - #btnCopySummary
 * - #btnWhatsSummary
 * - #quickStatus (container)
 */
const btnCopySummary = document.getElementById("btnCopySummary");
const btnWhatsSummary = document.getElementById("btnWhatsSummary");
const quickStatusWrap = document.getElementById("quickStatus");

let ORDERS = [];
let CURRENT_ID = null;

/* =========================
   HELPERS
========================= */
function brl(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function normalizeStatus(s) {
  s = String(s || "novo").toLowerCase().trim();
  if (["novo","pendente","pago","enviado","cancelado"].includes(s)) return s;
  // aceita variações
  if (s.includes("pend")) return "pendente";
  if (s.includes("pag")) return "pago";
  if (s.includes("env")) return "enviado";
  if (s.includes("canc")) return "cancelado";
  return "novo";
}

function badgeClass(status){
  if (status === "pago" || status === "enviado") return "ok";
  if (status === "pendente" || status === "novo") return "wait";
  return "bad";
}

function msFromAnyDate(d){
  // Timestamp -> ms
  try{
    if (!d) return 0;
    if (typeof d?.toMillis === "function") return d.toMillis();
    if (d?.seconds) return d.seconds * 1000;
    if (d instanceof Date) return d.getTime();
    if (typeof d === "number") return d;
    if (typeof d === "string") {
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    }
    return 0;
  }catch{
    return 0;
  }
}

function formatDateMaybe(createdAt){
  try{
    const ms = msFromAnyDate(createdAt);
    if (!ms) return "—";
    return new Date(ms).toLocaleString("pt-BR");
  }catch{
    return "—";
  }
}

function getOrderItems(o){
  return Array.isArray(o.items) ? o.items : (Array.isArray(o.cart) ? o.cart : []);
}

function getOrderTotal(o){
  if (o.total != null) return Number(o.total) || 0;
  if (o.pricing?.total != null) return Number(o.pricing.total) || 0;
  const items = getOrderItems(o);
  return items.reduce((sum, it) => sum + (Number(it.price)||0) * (Number(it.qty)||1), 0);
}

function getPricing(o){
  const subtotal = o.subtotal ?? o.pricing?.subtotal ?? 0;
  const discount = o.discount ?? o.pricing?.discount ?? 0;
  const shipping = o.shipping ?? o.pricing?.shipping ?? 0;
  const total = o.total ?? o.pricing?.total ?? getOrderTotal(o);
  return {
    subtotal: Number(subtotal)||0,
    discount: Number(discount)||0,
    shipping: Number(shipping)||0,
    total: Number(total)||0,
  };
}

function safePhone(raw){
  // cria telefone limpinho p/ wa.me
  const digits = String(raw || "").replace(/\D/g,"");
  // se for BR e tiver 11/10 ok. se estiver vazio, retorna ""
  return digits;
}

/* =========================
   FETCH + FILTER
========================= */
async function fetchOrders(){
  const snap = await getDocs(collection(db, "pedidos"));
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  ORDERS = list;
}

function getSearchHay(o){
  return [
    o.id,
    o.nome, o.name,
    o.whatsapp, o.phone, o.telefone,
    o.email,
    o.endereco, o.address,
    o.pagamento, o.payment,
    o.status
  ].map(v => String(v||"").toLowerCase()).join(" ");
}

function applyFilters(){
  const q = (searchInput?.value || "").trim().toLowerCase();
  const st = statusFilter?.value || "all";
  const sort = sortFilter?.value || "newest";

  let rows = [...ORDERS];

  if (q){
    rows = rows.filter(o => {
      // busca por começo do ID também ajuda demais
      const idShort = String(o.id || "").slice(0,8).toLowerCase();
      const hay = getSearchHay(o);
      return hay.includes(q) || idShort.includes(q);
    });
  }

  if (st !== "all"){
    rows = rows.filter(o => normalizeStatus(o.status) === st);
  }

  rows.sort((a,b) => {
    const aTotal = getOrderTotal(a);
    const bTotal = getOrderTotal(b);

    const aTime = msFromAnyDate(a.createdAt || a.created_at);
    const bTime = msFromAnyDate(b.createdAt || b.created_at);

    if (sort === "newest") return (bTime||0) - (aTime||0);
    if (sort === "oldest") return (aTime||0) - (bTime||0);
    if (sort === "total-desc") return bTotal - aTotal;
    if (sort === "total-asc") return aTotal - bTotal;
    return 0;
  });

  if (countEl) countEl.textContent = rows.length;
  renderTable(rows);
}

/* =========================
   TABLE RENDER
========================= */
function renderTable(rows){
  if (!tbody) return;

  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(o => {
    const status = normalizeStatus(o.status);
    const cls = badgeClass(status);
    const total = brl(getOrderTotal(o));
    const date = formatDateMaybe(o.createdAt || o.created_at);

    const name = o.nome || o.name || "Cliente";
    const phone = o.whatsapp || o.phone || o.telefone || "—";

    return `
      <tr class="row-click" data-id="${o.id}">
        <td><code>${escapeHtml(String(o.id).slice(0,8))}…</code></td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(phone)}</td>
        <td><strong>${total}</strong></td>
        <td><span class="badge ${cls}">${status}</span></td>
        <td class="muted small">${date}</td>
        <td class="actions">
          <button class="btn-mini" data-open="${o.id}" type="button">Ver</button>
          <button class="btn-mini ghost" data-copy="${o.id}" type="button">Copiar ID</button>
        </td>
      </tr>
    `;
  }).join("");

  // binds
  tbody.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openOrder(btn.dataset.open);
    });
  });

  tbody.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "Copiado!";
      setTimeout(() => btn.textContent = "Copiar ID", 900);
    });
  });

  tbody.querySelectorAll(".row-click").forEach(tr => {
    tr.addEventListener("click", () => openOrder(tr.dataset.id));
  });
}

/* =========================
   MODAL
========================= */
function openModal(open){
  if (!modal) return;
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  if (!open){
    CURRENT_ID = null;
    if (mMsg) mMsg.textContent = "";
  }
}

function buildSummaryText(o){
  const items = getOrderItems(o);
  const pricing = getPricing(o);
  const status = normalizeStatus(o.status);

  const lines = [];
  lines.push(`🧾 *Pedido ForceLab*`);
  lines.push(`ID: ${o.id}`);
  lines.push(`Status: ${status}`);
  lines.push(`Cliente: ${o.nome || o.name || "—"}`);
  lines.push(`WhatsApp: ${o.whatsapp || o.phone || o.telefone || "—"}`);
  lines.push(`Pagamento: ${o.pagamento || o.payment || "—"}`);
  lines.push(`Endereço: ${o.endereco || o.address || "—"}`);
  lines.push("");
  lines.push(`📦 *Itens*`);
  if (!items.length) {
    lines.push("- (sem itens salvos)");
  } else {
    items.forEach(it => {
      const nm = it.name || it.nome || "Item";
      const qty = Number(it.qty)||1;
      const price = Number(it.price)||0;
      lines.push(`- ${qty}x ${nm} — ${brl(price)} (${brl(qty*price)})`);
    });
  }
  lines.push("");
  lines.push(`Subtotal: ${brl(pricing.subtotal)}`);
  lines.push(`Desconto: - ${brl(pricing.discount)}`);
  lines.push(`Frete: ${brl(pricing.shipping)}`);
  lines.push(`*Total: ${brl(pricing.total)}*`);
  return lines.join("\n");
}

function renderQuickStatus(status){
  if (!quickStatusWrap) return;

  const options = ["novo","pendente","pago","enviado","cancelado"];
  quickStatusWrap.innerHTML = options.map(s => {
    const cls = badgeClass(s);
    const active = s === status ? "active" : "";
    return `<button type="button" class="qs ${cls} ${active}" data-qs="${s}">${s}</button>`;
  }).join("");

  quickStatusWrap.querySelectorAll("[data-qs]").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = btn.dataset.qs;
      if (mStatus) mStatus.value = s;
      if (mStatusBadge) {
        mStatusBadge.className = `badge ${badgeClass(s)}`;
        mStatusBadge.textContent = s;
      }
      // feedback visual
      renderQuickStatus(s);
    });
  });
}

function openOrder(id){
  const o = ORDERS.find(x => x.id === id);
  if (!o) return;

  CURRENT_ID = id;
  if (mMsg) mMsg.textContent = "";

  const status = normalizeStatus(o.status);
  const cls = badgeClass(status);

  if (mTitle) mTitle.textContent = `Pedido ${id.slice(0,8)}…`;
  if (mSub) mSub.textContent = formatDateMaybe(o.createdAt || o.created_at);

  if (mName) mName.textContent = o.nome || o.name || "—";
  if (mEmail) mEmail.textContent = o.email || "—";
  if (mPhone) mPhone.textContent = o.whatsapp || o.phone || o.telefone || "—";
  if (mAddress) mAddress.textContent = o.endereco || o.address || "—";
  if (mPay) mPay.textContent = o.pagamento || o.payment || "—";

  if (mStatus) mStatus.value = status;
  if (mStatusBadge){
    mStatusBadge.className = `badge ${cls}`;
    mStatusBadge.textContent = status;
  }

  renderQuickStatus(status);

  const items = getOrderItems(o);
  if (mItems){
    mItems.innerHTML = items.length ? items.map(it => {
      const nm = it.name || it.nome || "Item";
      const qty = Number(it.qty)||1;
      const price = Number(it.price)||0;
      const img = it.image || it.img || "";
      return `
        <div class="item">
          <div class="item-img">${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(nm)}">` : "🧃"}</div>
          <div class="item-info">
            <strong>${escapeHtml(nm)}</strong>
            <small>${qty} × ${brl(price)}</small>
          </div>
          <div class="item-total">${brl(qty * price)}</div>
        </div>
      `;
    }).join("") : `<p class="muted">Sem itens salvos nesse pedido.</p>`;
  }

  const pricing = getPricing(o);
  if (mSubtotal) mSubtotal.textContent = brl(pricing.subtotal);
  if (mDiscount) mDiscount.textContent = `- ${brl(pricing.discount)}`;
  if (mShipping) mShipping.textContent = brl(pricing.shipping);
  if (mTotal) mTotal.textContent = brl(pricing.total);

  const uid = o.uid || o.userId || "—";
  if (mMeta) mMeta.textContent = `UID: ${uid} • Documento: pedidos/${id}`;

  // Botões extras
  btnCopySummary?.addEventListener("click", async () => {
    const txt = buildSummaryText(o);
    await navigator.clipboard.writeText(txt);
    if (mMsg) {
      mMsg.textContent = "Resumo copiado ✅";
      setTimeout(() => (mMsg.textContent = ""), 1400);
    }
  });

  btnWhatsSummary?.addEventListener("click", () => {
    const phone = safePhone(o.whatsapp || o.phone || o.telefone);
    const text = encodeURIComponent(buildSummaryText(o));
    if (!phone){
      // se não tiver número, abre wa.me sem destinatário
      window.open(`https://wa.me/?text=${text}`, "_blank");
      return;
    }
    // se vier sem 55, adiciona
    const p = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${p}?text=${text}`, "_blank");
  });

  openModal(true);
}

async function saveStatus(){
  if (!CURRENT_ID) return;
  const newStatus = normalizeStatus(mStatus?.value);

  if (btnSaveStatus) btnSaveStatus.disabled = true;
  if (mMsg) mMsg.textContent = "Salvando...";

  try{
    await updateDoc(doc(db, "pedidos", CURRENT_ID), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // atualiza local
    const idx = ORDERS.findIndex(o => o.id === CURRENT_ID);
    if (idx >= 0){
      ORDERS[idx].status = newStatus;
      ORDERS[idx].updatedAt = new Date();
    }

    if (mStatusBadge){
      mStatusBadge.className = `badge ${badgeClass(newStatus)}`;
      mStatusBadge.textContent = newStatus;
    }

    renderQuickStatus(newStatus);

    if (mMsg) mMsg.textContent = "Status atualizado ✅";
    applyFilters();
  }catch(err){
    console.error(err);
    if (mMsg) mMsg.textContent = "Sem permissão ou erro ao salvar.";
  }finally{
    if (btnSaveStatus) btnSaveStatus.disabled = false;
    setTimeout(() => { if (mMsg) mMsg.textContent = ""; }, 1600);
  }
}

async function deleteOrder(){
  if (!CURRENT_ID) return;
  const ok = confirm("Tem certeza que deseja excluir este pedido? Isso não pode ser desfeito.");
  if (!ok) return;

  if (btnDeleteOrder) btnDeleteOrder.disabled = true;
  if (mMsg) mMsg.textContent = "Excluindo...";

  try{
    await deleteDoc(doc(db, "pedidos", CURRENT_ID));
    ORDERS = ORDERS.filter(o => o.id !== CURRENT_ID);
    openModal(false);
    applyFilters();
  }catch(err){
    console.error(err);
    if (mMsg) mMsg.textContent = "Sem permissão ou erro ao excluir.";
  }finally{
    if (btnDeleteOrder) btnDeleteOrder.disabled = false;
  }
}

/* =========================
   BINDS
========================= */
// modal close: clique no overlay (qualquer elemento com data-close) ou ESC
modal?.addEventListener("click", (e) => {
  const el = e.target;
  if (el?.dataset?.close) openModal(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openModal(false);
});

// debounce search (melhor UX)
let tDeb = null;
function debounceApply(){
  clearTimeout(tDeb);
  tDeb = setTimeout(applyFilters, 180);
}

searchInput?.addEventListener("input", debounceApply);
statusFilter?.addEventListener("change", applyFilters);
sortFilter?.addEventListener("change", applyFilters);

btnRefresh?.addEventListener("click", async () => {
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="muted">Atualizando...</td></tr>`;
  await boot();
});

btnClear?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  if (statusFilter) statusFilter.value = "all";
  if (sortFilter) sortFilter.value = "newest";
  applyFilters();
});

// modal actions
btnSaveStatus?.addEventListener("click", saveStatus);
btnDeleteOrder?.addEventListener("click", deleteOrder);

async function boot(){
  await fetchOrders();
  applyFilters();
}

boot();
