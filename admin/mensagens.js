// admin/mensagens.js
import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ===== DOM =====
const msgSearch = document.getElementById("msgSearch");
const msgFilter = document.getElementById("msgFilter");
const btnClear = document.getElementById("btnClear");

const msgCount = document.getElementById("msgCount");
const msgList = document.getElementById("msgList");

const msgEmpty = document.getElementById("msgEmpty");
const msgCard = document.getElementById("msgCard");

const vName = document.getElementById("vName");
const vMeta = document.getElementById("vMeta");
const vText = document.getElementById("vText");

const btnMarkRead = document.getElementById("btnMarkRead");
const btnWhats = document.getElementById("btnWhats");
const btnMail = document.getElementById("btnMail");

// ===== State =====
let ALL = [];
let CURRENT_ID = null;

// ===== Helpers =====
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Pega campos mesmo que você tenha salvo com nomes diferentes
function pickName(m) {
  return (
    m?.nome ??
    m?.name ??
    m?.nomeContato ??
    m?.customer?.nome ??
    m?.customer?.name ??
    m?.dados?.nome ??
    ""
  );
}

function pickEmail(m) {
  return (
    m?.email ??
    m?.mail ??
    m?.emailContato ??
    m?.customer?.email ??
    m?.dados?.email ??
    ""
  );
}

function pickWhats(m) {
  return (
    m?.whatsapp ??
    m?.phone ??
    m?.tel ??
    m?.whats ??
    m?.whatsContato ??
    m?.customer?.whatsapp ??
    m?.customer?.phone ??
    m?.dados?.whatsapp ??
    ""
  );
}

function pickText(m) {
  return (
    m?.mensagem ??
    m?.message ??
    m?.texto ??
    m?.text ??
    m?.msg ??
    m?.msgContato ??
    m?.mensagemContato ??
    m?.dados?.mensagem ??
    ""
  );
}

function isRead(m) {
  // Aceita vários formatos: status, lido true/false, readAt...
  if (m?.status) return String(m.status).toLowerCase() === "lido";
  if (typeof m?.lido === "boolean") return m.lido === true;
  if (m?.readAt) return true;
  return false;
}

function normalizePhoneBR(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  // wa.me aceita com DDI. Se já tem 55 ok, se não tiver, adiciona 55.
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function getDateText(m) {
  // createdAt pode ser Timestamp do Firestore (toDate)
  // createdAtClient pode ser ISO string
  try {
    if (m?.createdAt?.toDate) {
      const d = m.createdAt.toDate();
      return d.toLocaleString("pt-BR");
    }
  } catch {}
  try {
    if (m?.createdAtClient) {
      const d = new Date(m.createdAtClient);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString("pt-BR");
    }
  } catch {}
  return "—";
}

function previewText(m, max = 36) {
  const t = String(pickText(m) || "")
    .trim()
    .replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t || "(sem conteúdo)";
}

// ===== Fetch =====
async function fetchMessages() {
  // tenta ordenar por createdAt (se existir). Se não existir em alguns docs, ainda funciona, só pode vir ordem esquisita.
  const q = query(collection(db, "contatos"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  ALL = list;
}

// ===== UI =====
function renderList(rows) {
  msgCount.textContent = rows.length;

  if (!rows.length) {
    msgList.innerHTML = `<div class="muted" style="padding:14px">Nenhuma mensagem.</div>`;
    return;
  }

  msgList.innerHTML = rows
    .map((m) => {
      const nome = pickName(m) || "Sem nome";
      const date = getDateText(m);
      const badge = isRead(m)
        ? `<span class="badge wait">lida</span>`
        : `<span class="badge ok">nova</span>`;

      return `
        <button class="msg-item" type="button" data-id="${escapeHtml(m.id)}">
          <div class="msg-item-top">
            <strong>${escapeHtml(nome)}</strong>
            ${badge}
          </div>
          <div class="muted small">${escapeHtml(date)}</div>

        </button>
      `;
    })
    .join("");

  msgList.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openMessage(btn.dataset.id));
  });
}

function applyFilters() {
  const q = String(msgSearch?.value || "")
    .trim()
    .toLowerCase();
  const f = String(msgFilter?.value || "all");

  let rows = [...ALL];

  if (q) {
    rows = rows.filter((m) => {
      const nome = String(pickName(m) || "").toLowerCase();
      const email = String(pickEmail(m) || "").toLowerCase();
      const whats = String(pickWhats(m) || "").toLowerCase();
      const text = String(pickText(m) || "").toLowerCase();
      return (
        nome.includes(q) ||
        email.includes(q) ||
        whats.includes(q) ||
        text.includes(q)
      );
    });
  }

  if (f === "novo") rows = rows.filter((m) => !isRead(m));
  if (f === "lido") rows = rows.filter((m) => isRead(m));

  renderList(rows);
}

function openMessage(id) {
  const m = ALL.find((x) => x.id === id);
  if (!m) return;

  CURRENT_ID = id;

  // mostra card e esconde tela vazia
  msgEmpty.hidden = true;
  msgCard.hidden = false;

  const nome = pickName(m) || "Sem nome";
  const email = pickEmail(m) || "";
  const whats = pickWhats(m) || "";
  const texto = pickText(m) || "(sem conteúdo)";
  const date = getDateText(m);

  vName.textContent = nome;

  const metaParts = [];
  if (email) metaParts.push(`E-mail: ${email}`);
  if (whats) metaParts.push(`WhatsApp: ${whats}`);
  metaParts.push(`Enviado: ${date}`);
  vMeta.textContent = metaParts.join(" • ");
 // garante que não exista snippet/preview dentro do card (só no vText)
msgCard.querySelectorAll(".msg-preview, .msg-snippet, #vPreview, #vSnippet")
  .forEach((el) => (el.textContent = ""));

  // <<< Aqui garante que o texto vai pro “espaço da mensagem”
  vText.textContent = texto;
  vText.style.whiteSpace = "pre-wrap";

  // links
  btnMail.href = email ? `mailto:${email}` : "#";
  btnWhats.href = whats ? `https://wa.me/${normalizePhoneBR(whats)}` : "#";

  // botão de lida
  const lida = isRead(m);
  btnMarkRead.disabled = lida;
  btnMarkRead.textContent = lida ? "Já está lida" : "Marcar como lida";
}

// ===== Actions =====
async function markAsRead() {
  if (!CURRENT_ID) return;

  const m = ALL.find((x) => x.id === CURRENT_ID);
  if (!m) return;

  try {
    btnMarkRead.disabled = true;
    btnMarkRead.textContent = "Salvando...";

    // salva em um formato bem compatível
    await updateDoc(doc(db, "contatos", CURRENT_ID), {
      status: "lido",
      lido: true,
      readAtClient: new Date().toISOString(),
    });

    // atualiza cache local
    m.status = "lido";
    m.lido = true;
    m.readAtClient = new Date().toISOString();

    // re-render lista (pra badge mudar)
    applyFilters();

    btnMarkRead.textContent = "Já está lida";
  } catch (err) {
    console.error(err);
    btnMarkRead.disabled = false;
    btnMarkRead.textContent = "Marcar como lida";
    alert("Sem permissão ou erro ao marcar como lida.");
  }
}

// ===== Boot =====
async function boot() {
  msgList.innerHTML = `<div class="muted" style="padding:14px">Carregando...</div>`;
  msgEmpty.hidden = false;
  msgCard.hidden = true;
  CURRENT_ID = null;

  await fetchMessages();
  applyFilters();
}

msgSearch?.addEventListener("input", applyFilters);
msgFilter?.addEventListener("change", applyFilters);

btnClear?.addEventListener("click", () => {
  msgSearch.value = "";
  msgFilter.value = "all";
  applyFilters();
});

btnMarkRead?.addEventListener("click", markAsRead);

boot();
