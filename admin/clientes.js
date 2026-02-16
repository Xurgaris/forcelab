import { requireAuth } from "./auth.js";
import { loadSidebar } from "./sidebar-loader.js";
requireAuth();
await loadSidebar("clientes");

import { db } from "../js/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const tbody = document.getElementById("clientsTbody");
const searchInput = document.getElementById("clientsSearch");
const sortSel = document.getElementById("clientsSort");
const countEl = document.getElementById("clientsCount");
const btnRefresh = document.getElementById("btnRefreshClients");
const btnClear = document.getElementById("btnClearClients");

// modal
const modal = document.getElementById("clientModal");
const cTitle = document.getElementById("cTitle");
const cSub = document.getElementById("cSub");
const cName = document.getElementById("cName");
const cEmail = document.getElementById("cEmail");
const cPhone = document.getElementById("cPhone");
const cAddress = document.getElementById("cAddress");
const cOrders = document.getElementById("cOrders");
const cOrdersCount = document.getElementById("cOrdersCount");
const cSpent = document.getElementById("cSpent");
const cMsg = document.getElementById("cMsg");
const btnCopyContact = document.getElementById("btnCopyContact");
const btnWhats = document.getElementById("btnWhats");

let CLIENTS = [];
let CURRENT = null;

function brl(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
function escapeHtml(s){
  return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function formatDateMaybe(createdAt){
  try{
    if (!createdAt) return "—";
    if (createdAt.toDate) return createdAt.toDate().toLocaleString("pt-BR");
    if (createdAt instanceof Date) return createdAt.toLocaleString("pt-BR");
    if (typeof createdAt === "number") return new Date(createdAt).toLocaleString("pt-BR");
    return new Date(createdAt).toLocaleString("pt-BR");
  }catch{ return "—"; }
}
function createdAtMs(createdAt){
  if (!createdAt) return 0;
  if (createdAt.toMillis) return createdAt.toMillis();
  if (createdAt.seconds) return createdAt.seconds * 1000;
  if (typeof createdAt === "number") return createdAt;
  return new Date(createdAt).getTime() || 0;
}
function normPhone(p){
  return String(p||"").replace(/\D/g,"");
}
function clientKeyFromOrder(o){
  const email = String(o.email||"").trim().toLowerCase();
  const phone = normPhone(o.whatsapp || o.phone || o.telefone);
  // prioridade: email -> phone -> uid -> fallback
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;
  if (o.uid) return `uid:${o.uid}`;
  return `unknown:${Math.random().toString(16).slice(2)}`;
}

async function fetchClients(){
  const snap = await getDocs(collection(db, "pedidos"));
  const map = new Map();

  snap.forEach(doc => {
    const o = { id: doc.id, ...doc.data() };
    const key = clientKeyFromOrder(o);

    const name = o.nome || o.name || "Cliente";
    const email = o.email || "";
    const phone = o.whatsapp || o.phone || o.telefone || "";
    const address = o.endereco || o.address || "";
    const total = Number(o.total ?? o.pricing?.total ?? 0) || 0;
    const when = createdAtMs(o.createdAt);

    if (!map.has(key)){
      map.set(key, {
        key,
        name,
        email,
        phone,
        lastAddress: address,
        ordersCount: 0,
        spent: 0,
        lastAtMs: 0,
        lastAtRaw: o.createdAt || null,
        orders: []
      });
    }

    const c = map.get(key);
    c.ordersCount += 1;
    c.spent += total;
    c.orders.push({
      id: o.id,
      total,
      status: String(o.status || "novo").toLowerCase(),
      createdAt: o.createdAt || null
    });

    if (when > c.lastAtMs){
      c.lastAtMs = when;
      c.lastAtRaw = o.createdAt || null;
      c.name = name || c.name;
      c.email = email || c.email;
      c.phone = phone || c.phone;
      c.lastAddress = address || c.lastAddress;
    }
  });

  CLIENTS = Array.from(map.values());
}

function applyFilters(){
  const q = (searchInput.value || "").trim().toLowerCase();
  const sort = sortSel.value;

  let rows = [...CLIENTS];

  if (q){
    rows = rows.filter(c => {
      const hay = [c.name, c.email, c.phone].map(v => String(v||"").toLowerCase()).join(" ");
      return hay.includes(q);
    });
  }

  rows.sort((a,b) => {
    if (sort === "last") return (b.lastAtMs||0) - (a.lastAtMs||0);
    if (sort === "spent-desc") return (b.spent||0) - (a.spent||0);
    if (sort === "spent-asc") return (a.spent||0) - (b.spent||0);
    if (sort === "orders-desc") return (b.ordersCount||0) - (a.ordersCount||0);
    if (sort === "orders-asc") return (a.ordersCount||0) - (b.ordersCount||0);
    if (sort === "name-asc") return String(a.name||"").localeCompare(String(b.name||""),"pt-BR");
    if (sort === "name-desc") return String(b.name||"").localeCompare(String(a.name||""),"pt-BR");
    return 0;
  });

  countEl.textContent = rows.length;
  render(rows);
}

function render(rows){
  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="6" class="muted">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(c => {
    const contact = c.email ? escapeHtml(c.email) : (c.phone ? escapeHtml(c.phone) : "—");
    const last = formatDateMaybe(c.lastAtRaw);

    return `
      <tr class="row-click" data-key="${escapeHtml(c.key)}">
        <td>
          <strong>${escapeHtml(c.name)}</strong>
          <div class="muted" style="font-size:12px;margin-top:4px;opacity:.75">ID: ${escapeHtml(c.key)}</div>
        </td>
        <td>${contact}</td>
        <td>${c.ordersCount}</td>
        <td>${brl(c.spent)}</td>
        <td>${last}</td>
        <td class="actions">
          <button class="btn-mini" data-open="${escapeHtml(c.key)}" type="button">Ver</button>
          <button class="btn-mini ghost" data-copy="${escapeHtml(c.key)}" type="button">Copiar</button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", (e)=>{ e.stopPropagation(); openClient(btn.dataset.open); });
  });
  tbody.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async (e)=>{
      e.stopPropagation();
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "Copiado!";
      setTimeout(()=>btn.textContent="Copiar", 900);
    });
  });
  tbody.querySelectorAll(".row-click").forEach(tr => {
    tr.addEventListener("click", ()=> openClient(tr.dataset.key));
  });
}

function openModal(open){
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  if (!open){ CURRENT = null; cMsg.textContent=""; }
}

function openClient(key){
  const c = CLIENTS.find(x => x.key === key);
  if (!c) return;
  CURRENT = c;
  cMsg.textContent = "";

  cTitle.textContent = c.name || "Cliente";
  cSub.textContent = `Última compra: ${formatDateMaybe(c.lastAtRaw)}`;

  cName.textContent = c.name || "—";
  cEmail.textContent = c.email || "—";
  cPhone.textContent = c.phone || "—";
  cAddress.textContent = c.lastAddress || "—";

  const list = [...(c.orders||[])].sort((a,b)=> createdAtMs(b.createdAt)-createdAtMs(a.createdAt)).slice(0, 12);
  cOrders.innerHTML = list.length ? list.map(o => `
    <div class="item">
      <div class="item-img">🧾</div>
      <div class="item-info">
        <strong>${escapeHtml(o.id.slice(0,8))}...</strong>
        <small>${escapeHtml(o.status)} • ${formatDateMaybe(o.createdAt)}</small>
      </div>
      <div class="item-total">${brl(o.total)}</div>
    </div>
  `).join("") : `<p class="muted">Sem pedidos.</p>`;

  cOrdersCount.textContent = `${c.ordersCount} pedido(s)`;
  cSpent.textContent = brl(c.spent);

  // ações
  const phoneDigits = normPhone(c.phone);
  btnWhats.href = phoneDigits ? `https://wa.me/55${phoneDigits}` : "#";
  btnWhats.style.pointerEvents = phoneDigits ? "auto" : "none";
  btnWhats.style.opacity = phoneDigits ? "1" : ".5";

  btnCopyContact.onclick = async () => {
    const txt = [c.name, c.email, c.phone].filter(Boolean).join(" • ");
    await navigator.clipboard.writeText(txt || c.key);
    cMsg.textContent = "Copiado ✅";
    setTimeout(()=>cMsg.textContent="", 1200);
  };

  openModal(true);
}

// modal close
modal?.addEventListener("click", (e)=>{ if (e.target?.dataset?.close) openModal(false); });
document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") openModal(false); });

// binds
searchInput?.addEventListener("input", applyFilters);
sortSel?.addEventListener("change", applyFilters);
btnClear?.addEventListener("click", ()=>{ searchInput.value=""; sortSel.value="last"; applyFilters(); });
btnRefresh?.addEventListener("click", async ()=>{
  tbody.innerHTML = `<tr><td colspan="6" class="muted">Atualizando...</td></tr>`;
  await boot();
});

async function boot(){
  await fetchClients();
  applyFilters();
}
boot();
