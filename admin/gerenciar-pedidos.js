import { db } from "/js/firebase.js";
import { requireAuth } from "/admin/auth.js";
import { loadSidebar } from "/admin/sidebar-loader.js";

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

await requireAuth();


// ===== DOM real do seu HTML =====
const ordersTbody = document.getElementById("ordersTbody");
const qInput = document.getElementById("ordersSearch");
const statusFilter = document.getElementById("ordersStatus");
const refreshBtn = document.getElementById("btnRefreshOrders");

const modal = document.getElementById("orderModal");
const modalTitle = document.getElementById("oTitle");
const modalSub = document.getElementById("oSub");
const statusSelect = document.getElementById("oStatus");
const trackingInput = document.getElementById("oTracking");
const saveBtn = document.getElementById("btnSaveOrder");
const oMsg = document.getElementById("oMsg");

let cached = [];
let currentId = null;

function brl(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function safeStr(v) {
  return String(v || "").toLowerCase().trim();
}

function formatDateMaybe(ts) {
  try {
    if (!ts) return "—";
    if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString("pt-BR");
    if (ts instanceof Date) return ts.toLocaleString("pt-BR");
    if (typeof ts === "number") return new Date(ts).toLocaleString("pt-BR");

    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toLocaleString("pt-BR");
    return "—";
  } catch {
    return "—";
  }
}

function normalizeOrder(o) {
  const customer = o.customer || {};
  const pricing = o.pricing || {};

  return {
    id: o.id,
    uid: o.uid || null,
    status: o.status || "aguardando_pagamento",
    createdAt: o.createdAt || null,
    customer: {
      nome: customer.nome || o.nome || "",
      whatsapp: customer.whatsapp || o.whatsapp || o.phone || o.telefone || "",
      email: customer.email || o.email || "",
    },
    pricing: {
      total: Number(pricing.total || o.total || 0),
    },
    trackingCode:
      o.trackingCode ||
      o.shipping?.trackingCode ||
      o.tracking?.code ||
      "",
    raw: o,
  };
}

function openModal(open) {
  if (!modal) return;
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.style.overflow = open ? "hidden" : "";
  if (!open) {
    currentId = null;
    if (oMsg) oMsg.textContent = "";
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest('[data-close="1"]')) openModal(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openModal(false);
});

function renderTable(list) {
  if (!ordersTbody) {
    console.error("Elemento #ordersTbody não encontrado.");
    return;
  }

  if (!list.length) {
    ordersTbody.innerHTML = `<tr><td colspan="6" class="muted">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  ordersTbody.innerHTML = list.map((o) => `
    <tr>
      <td>
        <strong>#${o.id.slice(0, 8)}</strong>
        <div class="muted" style="font-size:12px;margin-top:4px">
          ${formatDateMaybe(o.createdAt)}
        </div>
      </td>

      <td>
        <strong>${o.customer.nome || "-"}</strong>
        <div class="muted" style="font-size:12px;margin-top:4px">
          ${o.customer.whatsapp || o.customer.email || ""}
        </div>
      </td>

      <td><strong>${brl(o.pricing.total)}</strong></td>

      <td>
        <span class="badge">${o.status}</span>
      </td>

      <td>
        ${o.trackingCode ? `<code>${o.trackingCode}</code>` : `<span class="muted">—</span>`}
      </td>

      <td style="text-align:right">
        <button class="btn-mini" type="button" data-open="${o.id}">
          Editar
        </button>
      </td>
    </tr>
  `).join("");

  ordersTbody.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openOrder(btn.dataset.open));
  });
}

function applyFilters() {
  const q = safeStr(qInput?.value);
  const st = statusFilter?.value || "";

  const filtered = cached.filter((o) => {
    const hay = [
      o.id,
      o.customer.nome,
      o.customer.whatsapp,
      o.customer.email,
      o.status,
      o.trackingCode,
    ].map(safeStr).join(" ");

    const okQ = !q || hay.includes(q);
    const okSt = !st || o.status === st;
    return okQ && okSt;
  });

  renderTable(filtered);
}

async function loadOrders() {
  if (!ordersTbody) {
    console.error("Elemento #ordersTbody não encontrado em gerenciar-pedidos.html");
    return;
  }

  ordersTbody.innerHTML = `<tr><td colspan="6" class="muted">Carregando...</td></tr>`;

  try {
    const qy = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(200)
    );

    const snap = await getDocs(qy);
    cached = snap.docs.map((d) => normalizeOrder({ id: d.id, ...d.data() }));
    applyFilters();
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    ordersTbody.innerHTML = `<tr><td colspan="6" class="muted">Erro ao carregar pedidos.</td></tr>`;
  }
}

function openOrder(id) {
  const o = cached.find((x) => x.id === id);
  if (!o) return;

  currentId = id;

  if (modalTitle) modalTitle.textContent = `Pedido ${id}`;
  if (modalSub) {
    modalSub.textContent = `${o.customer.nome || "-"} • ${o.customer.whatsapp || o.customer.email || ""}`;
  }

  if (statusSelect) statusSelect.value = o.status || "aguardando_pagamento";
  if (trackingInput) trackingInput.value = o.trackingCode || "";
  if (oMsg) oMsg.textContent = "";

  openModal(true);
}

saveBtn?.addEventListener("click", async () => {
  if (!currentId) return;

  const status = statusSelect?.value || "aguardando_pagamento";
  const trackingCode = String(trackingInput?.value || "").trim() || null;

  const patch = {
    status,
    trackingCode,
    updatedAt: serverTimestamp(),
  };

  if (status === "enviado") patch.shippedAt = serverTimestamp();
  if (status === "entregue") patch.deliveredAt = serverTimestamp();

  try {
    saveBtn.disabled = true;
    if (oMsg) oMsg.textContent = "Salvando...";

    await updateDoc(doc(db, "orders", currentId), patch);

    if (oMsg) oMsg.textContent = "Salvo com sucesso ✅";
    await loadOrders();

    setTimeout(() => {
      openModal(false);
    }, 500);
  } catch (err) {
    console.error("Erro ao salvar pedido:", err);
    if (oMsg) oMsg.textContent = "Erro ao salvar.";
  } finally {
    saveBtn.disabled = false;
  }
});

qInput?.addEventListener("input", applyFilters);
statusFilter?.addEventListener("change", applyFilters);
refreshBtn?.addEventListener("click", loadOrders);

loadOrders();