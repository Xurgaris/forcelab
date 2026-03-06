// /cliente/conta/conta.js
import { watchAuth, logout } from "../_shared/auth.js";
import { db } from "/js/firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ==========================
   ELEMENTOS
========================== */
const statusEl = document.getElementById("status");
const btnLogout = document.getElementById("btnLogout");

const clientName = document.getElementById("clientName");
const clientEmail = document.getElementById("clientEmail");
const clientHello = document.getElementById("clientHello");

// tabelas
const lastOrdersTbody = document.getElementById("lastOrders");
const allOrdersTbody = document.getElementById("allOrders");

// counters
const stPending = document.getElementById("stPending");
const stConfirm = document.getElementById("stConfirm");
const stShipped = document.getElementById("stShipped");
const stDone = document.getElementById("stDone");

// drawer
const orderDrawer = document.getElementById("orderDrawer");
const odTitle = document.getElementById("odTitle");
const odSub = document.getElementById("odSub");
const odBody = document.getElementById("odBody");

// meus dados
const uNome = document.getElementById("uNome");
const uWhatsapp = document.getElementById("uWhatsapp");
const uEmail = document.getElementById("uEmail");
const uEndereco = document.getElementById("uEndereco");
const uCep = document.getElementById("uCep");

const btnSaveProfile = document.getElementById("btnSaveProfile");
const btnFillFromLastOrder = document.getElementById("btnFillFromLastOrder");
const profileMsg = document.getElementById("profileMsg");

/* ==========================
   TABS
========================== */
function setActiveTab(tab) {
  document
    .querySelectorAll(".client-tab")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".client-nav-item[data-tab]")
    .forEach((a) => a.classList.remove("active"));

  document.getElementById(`tab-${tab}`)?.classList.add("active");
  document
    .querySelector(`.client-nav-item[data-tab="${tab}"]`)
    ?.classList.add("active");
}

function getTabFromHash() {
  const h = (location.hash || "#perfil").replace("#", "").trim();
  return h || "perfil";
}

window.addEventListener("hashchange", () => setActiveTab(getTabFromHash()));
setActiveTab(getTabFromHash());

/* ==========================
   LOGOUT
========================== */
btnLogout?.addEventListener("click", async () => {
  await logout();
  window.location.href = "/";
});

/* ==========================
   HELPERS
========================== */
function brl(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatFirestoreTimestamp(ts) {
  if (!ts) return "—";
  try {
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return d.toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function paymentLabel(method) {
  const m = String(method || "").toLowerCase();
  if (m.includes("pix")) return "PIX";

  const cards = ["master", "visa", "elo", "amex", "hipercard"];
  if (cards.some((c) => m.includes(c))) return `CARTÃO (${m.toUpperCase()})`;

  return method ? String(method).toUpperCase() : "—";
}

function statusLabel(orderStatus, mpStatus) {
  const s = String(mpStatus || orderStatus || "").toLowerCase();

  // Mercado Pago
  if (s === "approved") return "CONCLUÍDO";
  if (s === "in_process") return "EM ANÁLISE";
  if (s === "pending") return "PENDENTE";
  if (s === "rejected" || s === "cancelled") return "NÃO APROVADO";

  // seu status interno
  if (s === "aguardando_pagamento") return "AGUARDANDO";
  if (s === "pago") return "CONCLUÍDO";
  if (s === "enviado") return "ENVIADO";
  if (s === "entregue" || s === "delivered") return "FINALIZADO";

  return s ? s.toUpperCase() : "—";
}

/**
 * buckets para os cards
 * pending  = aguardando/pending/in_process
 * confirm  = aprovado/pago (separação)
 * shipped  = enviado
 * done     = entregue/finalizado
 */
function bucketOrder(data) {
  const orderStatus = String(data?.status || "").toLowerCase();
  const mpStatus = String(data?.mp?.status || "").toLowerCase();

  if (orderStatus === "delivered" || orderStatus === "entregue") return "done";
  if (orderStatus === "shipped" || orderStatus === "enviado") return "shipped";
  if (mpStatus === "approved" || orderStatus === "pago") return "confirm";

  if (
    mpStatus === "in_process" ||
    mpStatus === "pending" ||
    orderStatus === "aguardando_pagamento"
  ) {
    return "pending";
  }

  if (mpStatus === "rejected" || mpStatus === "cancelled") return "pending";
  return "pending";
}

/* ==========================
   FILTRO (cards)
========================== */
function setActiveStat(filter) {
  document.querySelectorAll(".order-stats .stat").forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
}

function applyOrdersFilter(filter) {
  if (!allOrdersTbody) return;
  const rows = Array.from(allOrdersTbody.querySelectorAll("tr"));
  rows.forEach((tr) => {
    const g = String(tr.getAttribute("data-bucket") || "");
    tr.style.display = !filter || filter === "all" || g === filter ? "" : "none";
  });
}

// clique nos cards
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".order-stats .stat[data-filter]");
  if (!btn) return;

  const f = btn.dataset.filter; // pending|confirm|shipped|done
  sessionStorage.setItem("ordersFilter", f);
  setActiveStat(f);

  // abre aba pedidos e aplica filtro
  location.hash = "#pedidos";
  setTimeout(() => applyOrdersFilter(f), 0);
});

/* ==========================
   DRAWER (detalhe pedido)
========================== */
function openOrderDrawer() {
  if (!orderDrawer) return;
  orderDrawer.classList.add("open");
  orderDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

async function showOrderDetail(orderId) {
  if (!odBody) return;

  openOrderDrawer();
  odTitle.textContent = `Pedido #${orderId.slice(0, 10).toUpperCase()}`;
  odSub.textContent = "Carregando…";
  odBody.innerHTML = `<p class="muted">Carregando…</p>`;

  const ref = doc(db, "orders", orderId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    odSub.textContent = "Não encontrado";
    odBody.innerHTML = `<p class="muted">Pedido não encontrado.</p>`;
    return;
  }

  const data = snap.data();
  const date = formatFirestoreTimestamp(data?.createdAt);
  const total = data?.pricing?.total ?? 0;
  const pay = paymentLabel(data?.mp?.method);
  const st = statusLabel(data?.status, data?.mp?.status);

  odSub.textContent = `${date} • ${pay} • ${st}`;

  const items = Array.isArray(data?.items) ? data.items : [];
  const itemsHtml = items
    .map(
      (it) => `
      <div class="od-item">
        <img src="${it?.image || "https://via.placeholder.com/80"}" alt="">
        <div style="flex:1">
          <strong>${it?.name || "Produto"}</strong><br/>
          <small class="muted">${Number(it?.qty || 1)}x • ${brl(it?.price || 0)}</small>
        </div>
        <strong>${brl(it?.subtotal ?? Number(it?.price || 0) * Number(it?.qty || 1))}</strong>
      </div>
    `
    )
    .join("");

  odBody.innerHTML = `
    <div class="od-kv"><span class="muted">Status</span><strong>${st}</strong></div>
    <div class="od-kv"><span class="muted">Pagamento</span><strong>${pay}</strong></div>
    <div class="od-kv"><span class="muted">Total</span><strong>${brl(total)}</strong></div>
    <div class="od-kv"><span class="muted">Endereço</span><strong>${data?.shipping?.endereco || "—"}</strong></div>

    <h3 style="margin:14px 0 8px;">Itens</h3>
    <div class="od-items">${itemsHtml || `<p class="muted">Sem itens.</p>`}</div>
  `;
}

// 1 listener global: "Ver"
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view-order]");
  if (!btn) return;
  showOrderDetail(btn.dataset.viewOrder);
});

/* ==========================
   MEUS DADOS
========================== */
function showProfileMsg(text, ok = true) {
  if (!profileMsg) return;
  profileMsg.style.display = "block";
  profileMsg.textContent = text;
  profileMsg.style.borderColor = ok
    ? "rgba(60,255,160,.25)"
    : "rgba(255,80,80,.25)";
  profileMsg.style.background = ok
    ? "rgba(60,255,160,.08)"
    : "rgba(255,80,80,.08)";
}

async function loadUserProfile(uid, fallbackEmail) {
  if (uEmail) uEmail.value = fallbackEmail || "";

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const p = snap.data() || {};
    if (uNome) uNome.value = p.nome || "";
    if (uWhatsapp) uWhatsapp.value = p.whatsapp || "";
    if (uEndereco) uEndereco.value = p.endereco || "";
    if (uCep) uCep.value = p.cep || "";
  }
}

async function saveUserProfile(uid, email) {
  const payload = {
    email: email || "",
    nome: String(uNome?.value || "").trim(),
    whatsapp: String(uWhatsapp?.value || "").trim(),
    endereco: String(uEndereco?.value || "").trim(),
    cep: String(uCep?.value || "").trim(),
    updatedAt: new Date().toISOString(),
  };

  if (!payload.nome) return showProfileMsg("Informe seu nome.", false);
  if (!payload.whatsapp) return showProfileMsg("Informe seu WhatsApp.", false);

  await setDoc(doc(db, "users", uid), payload, { merge: true });
  showProfileMsg("Dados salvos com sucesso ✅", true);
}

async function fillFromLastOrder(uid) {
  const qLast = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snap = await getDocs(qLast);
  if (snap.empty) {
    return showProfileMsg("Você ainda não tem pedidos para puxar dados.", false);
  }

  const data = snap.docs[0].data() || {};
  if (uNome) uNome.value = data?.customer?.nome || uNome.value;
  if (uWhatsapp) uWhatsapp.value = data?.customer?.whatsapp || uWhatsapp.value;
  if (uEndereco) uEndereco.value = data?.shipping?.endereco || uEndereco.value;
  if (uCep) uCep.value = data?.pricing?.cep || uCep.value;

  showProfileMsg("Dados puxados do último pedido. Agora clique em Salvar ✅", true);
}

/* ==========================
   LISTAS
========================== */
async function loadLastOrders(uid) {
  if (!lastOrdersTbody) return;

  lastOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Carregando pedidos…</td></tr>`;

  const q = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    lastOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Você ainda não tem pedidos.</td></tr>`;
    return;
  }

  lastOrdersTbody.innerHTML = "";
  snap.forEach((d) => {
    const data = d.data();
    const orderId = d.id;
    const total = data?.pricing?.total ?? 0;
    const date = formatFirestoreTimestamp(data?.createdAt);
    const pay = paymentLabel(data?.mp?.method);
    const st = statusLabel(data?.status, data?.mp?.status);

    lastOrdersTbody.innerHTML += `
      <tr>
        <td>#${orderId.slice(0, 10).toUpperCase()}</td>
        <td>${pay}</td>
        <td>${date}</td>
        <td>${brl(total)}</td>
        <td><strong>${st}</strong></td>
        <td><button class="btn btn-ghost btn-sm" type="button" data-view-order="${orderId}">Ver</button></td>
      </tr>
    `;
  });
}

async function loadAllOrders(uid) {
  if (!allOrdersTbody) return;

  allOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Carregando pedidos…</td></tr>`;

  const qAll = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snap = await getDocs(qAll);

  if (snap.empty) {
    allOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Você ainda não tem pedidos.</td></tr>`;
    if (stPending) stPending.textContent = "0";
    if (stConfirm) stConfirm.textContent = "0";
    if (stShipped) stShipped.textContent = "0";
    if (stDone) stDone.textContent = "0";
    return;
  }

  let cPending = 0, cConfirm = 0, cShipped = 0, cDone = 0;

  // render
  allOrdersTbody.innerHTML = "";
  snap.forEach((d) => {
    const data = d.data();
    const orderId = d.id;

    const b = bucketOrder(data);
    if (b === "pending") cPending++;
    if (b === "confirm") cConfirm++;
    if (b === "shipped") cShipped++;
    if (b === "done") cDone++;

    const total = data?.pricing?.total ?? 0;
    const date = formatFirestoreTimestamp(data?.createdAt);
    const pay = paymentLabel(data?.mp?.method);
    const st = statusLabel(data?.status, data?.mp?.status);

    allOrdersTbody.innerHTML += `
      <tr data-bucket="${b}">
        <td>#${orderId.slice(0, 10).toUpperCase()}</td>
        <td>${pay}</td>
        <td>${date}</td>
        <td>${brl(total)}</td>
        <td><strong>${st}</strong></td>
        <td><button class="btn btn-ghost btn-sm" type="button" data-view-order="${orderId}">Ver</button></td>
      </tr>
    `;
  });

  // counters
  if (stPending) stPending.textContent = String(cPending);
  if (stConfirm) stConfirm.textContent = String(cConfirm);
  if (stShipped) stShipped.textContent = String(cShipped);
  if (stDone) stDone.textContent = String(cDone);

  // aplica filtro salvo (uma vez, no final)
  const saved = sessionStorage.getItem("ordersFilter") || "";
  if (saved) {
    setActiveStat(saved);
    applyOrdersFilter(saved);
  }
}

/* ==========================
   AUTH
========================== */
watchAuth(async (user) => {
  if (!user) {
    window.location.href = "/cliente/login/";
    return;
  }

  const email = user.email || "—";
  const nome = (user.displayName || email.split("@")[0] || "Cliente").trim();

  statusEl.textContent = "Conta ativa.";
  clientEmail.textContent = email;
  clientName.textContent = nome;
  clientHello.textContent = `Olá, ${nome}`;

  await loadLastOrders(user.uid);
  await loadAllOrders(user.uid);
  await loadUserProfile(user.uid, user.email);

  // listeners (uma vez)
  btnSaveProfile?.addEventListener("click", async () => {
    try {
      btnSaveProfile.disabled = true;
      await saveUserProfile(user.uid, user.email);
    } catch (e) {
      console.error(e);
      showProfileMsg("Não foi possível salvar seus dados.", false);
    } finally {
      btnSaveProfile.disabled = false;
    }
  });

  btnFillFromLastOrder?.addEventListener("click", async () => {
    try {
      btnFillFromLastOrder.disabled = true;
      await fillFromLastOrder(user.uid);
    } catch (e) {
      console.error(e);
      showProfileMsg("Não foi possível puxar do último pedido.", false);
    } finally {
      btnFillFromLastOrder.disabled = false;
    }
  });
});