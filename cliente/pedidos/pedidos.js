import { watchAuth } from "../_shared/auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

const app = getApp();
const db = getFirestore(app);

const sub = document.getElementById("sub");
const list = document.getElementById("list");

// drawer els
const orderDrawer = document.getElementById("orderDrawer");
const odTitle = document.getElementById("odTitle");
const odSub = document.getElementById("odSub");
const odBody = document.getElementById("odBody");

function brl(n) {
  return Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(ts) {
  if (!ts) return "";
  try {
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return d.toLocaleString("pt-BR");
  } catch {
    return "";
  }
}

function paymentLabel(method) {
  const m = String(method || "").toLowerCase();
  if (m.includes("pix")) return "Pix";
  const cards = ["master", "visa", "elo", "amex", "hipercard"];
  if (cards.some((c) => m.includes(c))) return `Cartão (${m.toUpperCase()})`;
  return method ? String(method).toUpperCase() : "—";
}

function statusLabel(orderStatus, mpStatus) {
  const v = String(mpStatus || orderStatus || "").toLowerCase();

  if (v === "approved") return "Aprovado";
  if (v === "in_process") return "Em análise";
  if (v === "pending") return "Pendente";
  if (v === "rejected" || v === "cancelled") return "Não aprovado";

  if (v === "aguardando_pagamento") return "Aguardando pagamento";
  if (v === "paid" || v === "pago") return "Pago";
  if (v === "shipped") return "Enviado";
  if (v === "delivered") return "Entregue";

  return "Pendente";
}

function computeStep(orderStatus, mpStatus) {
  const s = String(orderStatus || "").toLowerCase();
  const mp = String(mpStatus || "").toLowerCase();

  // enviado / entregue (seu status interno)
  if (s === "delivered") return 5;
  if (s === "shipped") return 4;

  // Mercado Pago: aprovado
  if (mp === "approved") return 3;

  // Mercado Pago: em análise ou pendente
  if (mp === "in_process") return 2;
  if (mp === "pending") return 2;

  // aguardando pagamento (interno)
  if (s === "aguardando_pagamento") return 1;

  // rejeitado/cancelado
  if (mp === "rejected" || mp === "cancelled" || s === "cancelled") return 0;

  // fallback
  return 1;
}

function timelineHtml(step) {
  // step:
  // 0 = cancelado
  // 1 = pedido realizado
  // 2 = em análise
  // 3 = aprovado
  // 4 = enviado
  // 5 = entregue

  if (step === 0) {
    return `
      <div class="timeline">
        <div class="tl-row current">
          <span class="tl-dot"></span>
          <div>
            <div class="tl-title">Pedido não aprovado</div>
            <span class="tl-sub">O pagamento foi recusado/cancelado.</span>
          </div>
        </div>
      </div>
    `;
  }

  const rows = [
    { n: 1, title: "Pedido realizado", sub: "Recebemos seu pedido." },
    {
      n: 2,
      title: "Pagamento em análise",
      sub: "O pagamento está sendo processado.",
    },
    { n: 3, title: "Pagamento aprovado", sub: "Seu pagamento foi confirmado." },
    { n: 4, title: "Pedido enviado", sub: "Seu pedido saiu para entrega." },
    { n: 5, title: "Entregue", sub: "Entrega finalizada." },
  ];

  return `
    <div class="timeline">
      ${rows
        .map((r) => {
          const cls = r.n < step ? "done" : r.n === step ? "current" : "";
          return `
          <div class="tl-row ${cls}">
            <span class="tl-dot"></span>
            <div>
              <div class="tl-title">${r.title}</div>
              <span class="tl-sub">${r.sub}</span>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function openDrawer() {
  if (!orderDrawer) return;
  orderDrawer.classList.add("open");
  orderDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

async function showOrderDetail(orderId) {
  if (!odBody) return;

  openDrawer();
  odTitle.textContent = `Pedido #${orderId.slice(0, 8).toUpperCase()}`;
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
  const date = formatDate(data?.createdAt);
  const total = data?.pricing?.total ?? 0;
  const pay = paymentLabel(data?.mp?.method);
  const st = statusLabel(data?.status, data?.mp?.status);
  const step = computeStep(data?.status, data?.mp?.status);
  const t1 = timelineHtml(step);

  odSub.textContent = `${date} • ${pay} • ${st}`;

  const items = Array.isArray(data?.items) ? data.items : [];
  const itemsHtml = items.length
    ? items
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
      `,
        )
        .join("")
    : `<p class="muted">Sem itens.</p>`;

  odBody.innerHTML = `
    <div class="od-kv"><span class="muted">Status</span><strong>${st}</strong></div>
    <div class="od-kv"><span class="muted">Pagamento</span><strong>${pay}</strong></div>
    <div class="od-kv"><span class="muted">Total</span><strong>${brl(total)}</strong></div>
    <div class="od-kv"><span class="muted">Endereço</span><strong>${data?.shipping?.endereco || "—"}</strong></div>

    ${t1}
    <h3 style="margin:14px 0 8px;">Itens</h3>
    <div class="od-items">${itemsHtml}</div>
  `;
}

function card(orderId, data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const itemsText = items.length
    ? items
        .slice(0, 3)
        .map((i) => `${i?.qty ?? 1}x ${i?.name ?? "Item"}`)
        .join(" • ")
    : "Itens não detalhados";

  const total = data?.pricing?.total ?? 0;
  const date = formatDate(data?.createdAt);
  const pay = paymentLabel(data?.mp?.method);
  const st = statusLabel(data?.status, data?.mp?.status);

  return `
    <div style="
      border:1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.22);
      border-radius: 16px;
      padding: 14px;
    ">
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="font-weight:700;">Pedido #${orderId.slice(0, 8).toUpperCase()}</div>
        <div style="color: rgba(255,255,255,.72); font-size:13px;">
          ${date}
        </div>
      </div>

      <div style="margin-top:8px; color: rgba(255,255,255,.86);">
        <div style="margin-bottom:6px; display:flex; gap:12px; flex-wrap:wrap;">
          <div><span style="opacity:.75;">Status:</span> <b>${st}</b></div>
          <div><span style="opacity:.75;">Pagamento:</span> <b>${pay}</b></div>
        </div>

        <div style="opacity:.85; font-size:14px; line-height:1.35;">
          ${itemsText}
        </div>

        <div style="margin-top:10px; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div><span style="opacity:.75;">Total:</span> <b>${brl(total)}</b></div>
          <button class="btn" type="button" data-view-order="${orderId}"
            style="padding:10px 12px; border-radius:12px;">
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  `;
}

// ✅ delegação (você não precisa ficar adicionando event listener depois do innerHTML)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view-order]");
  if (!btn) return;
  showOrderDetail(btn.dataset.viewOrder);
});

watchAuth(async (user) => {
  if (!user) {
    window.location.href = "/cliente/login/";
    return;
  }

  try {
    sub.textContent = `Logado como ${user.email}. Buscando pedidos...`;

    const q = query(
      collection(db, "orders"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      sub.textContent = "Você ainda não tem pedidos.";
      list.innerHTML = `
        <div class="msg" style="display:block;">
          Quando você finalizar uma compra, seus pedidos vão aparecer aqui.
        </div>
      `;
      return;
    }

    sub.textContent = `Encontramos ${snap.size} pedido(s).`;

    let html = "";
    snap.forEach((docu) => {
      html += card(docu.id, docu.data());
    });

    list.innerHTML = html;
  } catch (err) {
    console.error(err);
    sub.textContent = "Não foi possível carregar seus pedidos.";
    list.innerHTML = `
      <div class="msg" style="display:block;">
        Erro ao buscar pedidos. Verifique as regras do Firestore e tente novamente.
      </div>
    `;
  }
});
