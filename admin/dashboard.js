import { requireAuth } from "./auth.js";
import { loadSidebar } from "./sidebar-loader.js";
requireAuth();
await loadSidebar("dashboard");

import { db } from "/js/firebase.js";
import {
  collection,
  getDocs,
  orderBy,
  limit,
  query
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const totalPedidosEl = document.getElementById("totalPedidos");
const totalVendasEl = document.getElementById("totalVendas");
const ticketMedioEl = document.getElementById("ticketMedio");
const lastOrdersEl = document.getElementById("lastOrders");
const statusListEl = document.getElementById("statusList");

const dashSearch = document.getElementById("dashSearch");
const refreshBtn = document.getElementById("refreshDash");

function brl(v){
  return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function badgeByStatus(statusRaw){
  const s = String(statusRaw || "novo").toLowerCase();
  if (s.includes("pago")) return { cls:"ok", label:"pago" };
  if (s.includes("enviado")) return { cls:"ok", label:"enviado" };
  if (s.includes("cancel")) return { cls:"danger", label:"cancelado" };
  if (s.includes("pend")) return { cls:"wait", label:"pendente" };
  return { cls:"wait", label:s || "novo" };
}

function formatDateMaybe(ts){
  // aceita Firestore Timestamp, Date, number, string
  try{
    if (!ts) return "—";
    if (typeof ts?.toDate === "function") {
      const d = ts.toDate();
      return d.toLocaleString("pt-BR");
    }
    if (ts instanceof Date) return ts.toLocaleString("pt-BR");
    if (typeof ts === "number") return new Date(ts).toLocaleString("pt-BR");
    // string
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toLocaleString("pt-BR");
    return "—";
  }catch{
    return "—";
  }
}

let LAST_ORDERS_CACHE = [];

function renderLastOrders(list){
  const q = (dashSearch?.value || "").trim().toLowerCase();

  let rows = [...list];
  if (q){
    rows = rows.filter(o => {
      const id = String(o.id || "").toLowerCase();
      const nome = String(o.data?.nome || "").toLowerCase();
      const email = String(o.data?.email || "").toLowerCase();
      return id.includes(q) || nome.includes(q) || email.includes(q);
    });
  }

  if (!rows.length){
    lastOrdersEl.innerHTML = `<tr><td colspan="5" class="muted">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  lastOrdersEl.innerHTML = rows.map(o => {
    const data = o.data || {};
    const b = badgeByStatus(data.status);
    const createdAt = data.createdAt || data.created_at || data.data || data.timestamp;

    return `
      <tr>
        <td><code>${String(o.id).slice(0,8)}…</code></td>
        <td>${data.nome || "Cliente"}</td>
        <td><strong>${brl(data.total)}</strong></td>
        <td><span class="badge ${b.cls}">${b.label}</span></td>
        <td class="muted small">${formatDateMaybe(createdAt)}</td>
      </tr>
    `;
  }).join("");
}

function renderStatusBreakdown(allDocs){
  const map = new Map();
  allDocs.forEach(d => {
    const s = String(d.data?.status || "novo").toLowerCase();
    map.set(s, (map.get(s) || 0) + 1);
  });

  const entries = [...map.entries()].sort((a,b) => b[1]-a[1]);
  const total = allDocs.length || 1;

  statusListEl.innerHTML = entries.map(([status, n]) => {
    const b = badgeByStatus(status);
    const pct = Math.round((n/total)*100);
    return `
      <div class="status-row">
        <div class="status-left">
          <span class="badge ${b.cls}">${b.label}</span>
          <span class="muted small">${n} pedidos</span>
        </div>
        <div class="status-bar">
          <span style="width:${pct}%"></span>
        </div>
        <strong class="small">${pct}%</strong>
      </div>
    `;
  }).join("") || `<div class="muted">Sem dados ainda.</div>`;
}

async function carregarDashboard(){
  // 1) TOTAL GERAL (para KPIs + status)
  const snap = await getDocs(collection(db, "pedidos"));
  const all = [];
  let totalVendas = 0;

  snap.forEach(doc => {
    const data = doc.data();
    const total = Number(data.total || 0);
    totalVendas += total;

    all.push({ id: doc.id, data });
  });

  totalPedidosEl.textContent = all.length;
  totalVendasEl.textContent = brl(totalVendas);

  const ticket = all.length ? (totalVendas / all.length) : 0;
  ticketMedioEl.textContent = brl(ticket);

  renderStatusBreakdown(all);

  // 2) ÚLTIMOS PEDIDOS (tentativa ordenada)
  try{
    const q = query(collection(db, "pedidos"), orderBy("createdAt","desc"), limit(12));
    const lastSnap = await getDocs(q);

    const last = [];
    lastSnap.forEach(d => last.push({ id: d.id, data: d.data() }));

    LAST_ORDERS_CACHE = last;
    renderLastOrders(LAST_ORDERS_CACHE);
  }catch(err){
    // fallback caso createdAt não exista/esteja inconsistente
    console.warn("[DASH] orderBy(createdAt) falhou, usando fallback:", err);

    // fallback: usa os "all" e tenta ordenar por createdAt localmente
    const sorted = [...all].sort((a,b) => {
      const ta = a.data?.createdAt?.toMillis?.() ?? new Date(a.data?.createdAt || 0).getTime() ?? 0;
      const tb = b.data?.createdAt?.toMillis?.() ?? new Date(b.data?.createdAt || 0).getTime() ?? 0;
      return tb - ta;
    }).slice(0, 12);

    LAST_ORDERS_CACHE = sorted;
    renderLastOrders(LAST_ORDERS_CACHE);
  }
}

/* binds */
dashSearch?.addEventListener("input", () => renderLastOrders(LAST_ORDERS_CACHE));
refreshBtn?.addEventListener("click", async () => {
  lastOrdersEl.innerHTML = `<tr><td colspan="5" class="muted">Atualizando...</td></tr>`;
  statusListEl.innerHTML = `<div class="muted">Atualizando...</div>`;
  await carregarDashboard();
});

carregarDashboard();
