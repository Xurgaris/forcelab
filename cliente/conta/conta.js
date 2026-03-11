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

window.addEventListener("hashchange", () => {
  setActiveTab(getTabFromHash());

  if (location.hash === "#pedidos") {
    const saved = sessionStorage.getItem("ordersFilter") || "";
    if (saved) {
      setActiveStat(saved);
      applyOrdersFilter(saved);
    } else {
      setActiveStat("all");
      applyOrdersFilter("all");
    }
  }
});

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

// data: aceita createdAt (Timestamp Firestore) OU createdAtClient (string/iso)
function formatOrderDate(data) {
  try {
    if (data?.createdAt && typeof data.createdAt.toDate === "function") {
      return data.createdAt.toDate().toLocaleString("pt-BR");
    }
  } catch {}
  if (data?.createdAtClient) {
    const d = new Date(data.createdAtClient);
    if (!isNaN(d.getTime())) return d.toLocaleString("pt-BR");
  }
  return "—";
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
  if (s === "pago") return "Em separação";
  if (s === "enviado" || s === "shipped") return "ENVIADO";
  if (s === "entregue" || s === "delivered") return "FINALIZADO";

  return s ? s.toUpperCase() : "—";
}

// buckets dos cards
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
    tr.style.display =
      !filter || filter === "all" || g === filter ? "" : "none";
  });
}
// ====== FILTRO POR BOTÕES (aba Meus pedidos) ======
const ordersFilterHint = document.getElementById("ordersFilterHint");
const btnClearOrdersFilter = document.getElementById("btnClearOrdersFilter");

function labelFilter(f) {
  if (f === "pending") return "Pendentes";
  if (f === "confirm") return "Em Separação";
  if (f === "shipped") return "Enviados";
  if (f === "done") return "Finalizados";
  return "Todos";
}

function setOrdersFilterUI(filter) {
  document.querySelectorAll(".of-btn[data-of]").forEach((b) => {
    b.classList.toggle("active", b.dataset.of === filter);
  });
  if (ordersFilterHint)
    ordersFilterHint.textContent = `Mostrando: ${labelFilter(filter)}`;
}

function setOrdersFilter(filter) {
  if (!filter || filter === "all") {
    sessionStorage.removeItem("ordersFilter");
    setOrdersFilterUI("all");
    applyOrdersFilter("all");
    return;
  }
  sessionStorage.setItem("ordersFilter", filter);
  setOrdersFilterUI(filter);
  applyOrdersFilter(filter);
}

// clique nos botões
document.addEventListener("click", (e) => {
  const b = e.target.closest(".of-btn[data-of]");
  if (!b) return;
  setOrdersFilter(b.dataset.of);
});

// limpar
btnClearOrdersFilter?.addEventListener("click", () => {
  setOrdersFilter("all");
});

// clique nos cards (Pendentes / etc)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".order-stats .stat[data-filter]");
  if (!btn) return;

  const f = btn.dataset.filter; // pending|confirm|shipped|done|all

  if (f === "all") sessionStorage.removeItem("ordersFilter");
  else sessionStorage.setItem("ordersFilter", f);

  setActiveStat(f);
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
  const date = formatOrderDate(data);
  const total = data?.pricing?.total ?? data?.total ?? 0;
  const pay = paymentLabel(data?.mp?.method);
  const st = statusLabel(data?.status, data?.mp?.status);

  odSub.textContent = `${date} • ${pay} • ${st}`;

  const items = Array.isArray(data?.items) ? data.items : [];
  const itemsHtml = items
    .map((it) => {
      const qty = Number(it?.qty || 1);
      const price = Number(it?.price || 0);
      const sub = it?.subtotal ?? price * qty;
      return `
        <div class="od-item">
          <img src="${it?.image || "https://via.placeholder.com/80"}" alt="">
          <div style="flex:1">
            <strong>${it?.name || "Produto"}</strong><br/>
            <small class="muted">${qty}x • ${brl(price)}</small>
          </div>
          <strong>${brl(sub)}</strong>
        </div>
      `;
    })
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

// 1 listener global: botão "Ver"
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
  // tenta pelo createdAt (Timestamp). Se der erro de index/tipo, cai no createdAtClient.
  let snap;
  try {
    const qLast = query(
      collection(db, "orders"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    snap = await getDocs(qLast);
  } catch (e) {
    const qLast2 = query(
      collection(db, "orders"),
      where("uid", "==", uid),
      orderBy("createdAtClient", "desc"),
      limit(1),
    );
    snap = await getDocs(qLast2);
  }

  if (!snap || snap.empty) {
    return showProfileMsg(
      "Você ainda não tem pedidos para puxar dados.",
      false,
    );
  }

  const data = snap.docs[0].data() || {};
  if (uNome) uNome.value = data?.customer?.nome || uNome.value;
  if (uWhatsapp) uWhatsapp.value = data?.customer?.whatsapp || uWhatsapp.value;
  if (uEndereco) uEndereco.value = data?.shipping?.endereco || uEndereco.value;
  if (uCep) uCep.value = data?.pricing?.cep || uCep.value;

  showProfileMsg(
    "Dados puxados do último pedido. Agora clique em Salvar ✅",
    true,
  );
}

/* ==========================
   LISTAS
========================== */
async function loadLastOrders(uid) {
  if (!lastOrdersTbody) return;

  lastOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Carregando pedidos…</td></tr>`;

  // tenta createdAt, cai pra createdAtClient
  let snap;
  try {
    const q = query(
      collection(db, "orders"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(5),
    );
    snap = await getDocs(q);
  } catch (e) {
    const q2 = query(
      collection(db, "orders"),
      where("uid", "==", uid),
      orderBy("createdAtClient", "desc"),
      limit(5),
    );
    snap = await getDocs(q2);
  }

  if (!snap || snap.empty) {
    lastOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Você ainda não tem pedidos.</td></tr>`;
    return;
  }

  lastOrdersTbody.innerHTML = "";
  snap.forEach((d) => {
    const data = d.data();
    const orderId = d.id;

    const total = data?.pricing?.total ?? data?.total ?? 0;
    const date = formatOrderDate(data);
    const pay = paymentLabel(data?.mp?.method);
    const st = statusLabel(data?.status, data?.mp?.status);

    lastOrdersTbody.innerHTML += `
      <tr data-bucket="${bucketOrder(data)}">
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

  // tenta createdAt, cai pra createdAtClient
  let snap;
  try {
    const qAll = query(
      collection(db, "orders"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    snap = await getDocs(qAll);
  } catch (e) {
    const qAll2 = query(
      collection(db, "orders"),
      where("uid", "==", uid),
      orderBy("createdAtClient", "desc"),
      limit(50),
    );
    snap = await getDocs(qAll2);
  }

  if (!snap || snap.empty) {
    allOrdersTbody.innerHTML = `<tr><td colspan="6" class="muted">Você ainda não tem pedidos.</td></tr>`;
    if (stPending) stPending.textContent = "0";
    if (stConfirm) stConfirm.textContent = "0";
    if (stShipped) stShipped.textContent = "0";
    if (stDone) stDone.textContent = "0";
    return;
  }

  // contadores
  let cPending = 0,
    cConfirm = 0,
    cShipped = 0,
    cDone = 0;

  allOrdersTbody.innerHTML = "";
  snap.forEach((d) => {
    const data = d.data();
    const orderId = d.id;

    const b = bucketOrder(data);
    if (b === "pending") cPending++;
    if (b === "confirm") cConfirm++;
    if (b === "shipped") cShipped++;
    if (b === "done") cDone++;

    const total = data?.pricing?.total ?? data?.total ?? 0;
    const date = formatOrderDate(data);
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
    const saved = sessionStorage.getItem("ordersFilter") || "all";
    setOrdersFilterUI(saved);
    applyOrdersFilter(saved);
  });

  // counters
  if (stPending) stPending.textContent = String(cPending);
  if (stConfirm) stConfirm.textContent = String(cConfirm);
  if (stShipped) stShipped.textContent = String(cShipped);
  if (stDone) stDone.textContent = String(cDone);

  // aplica filtro salvo
  const saved = sessionStorage.getItem("ordersFilter") || "";
  if (saved) {
    setActiveStat(saved);
    applyOrdersFilter(saved);
  }
}

/* ==========================
   AUTH
========================== */
let listenersBound = false;

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

  // carrega tudo
  await loadLastOrders(user.uid);
  await loadAllOrders(user.uid);
  await loadUserProfile(user.uid, user.email);

  // listeners (só uma vez)
  if (!listenersBound) {
    listenersBound = true;

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
  }
});
