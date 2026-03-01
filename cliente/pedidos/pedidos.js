import { auth, watchAuth } from "../_shared/auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

// Usa o mesmo app já inicializado no auth.js
const app = getApp();
const db = getFirestore(app);

const sub = document.getElementById("sub");
const list = document.getElementById("list");

function statusLabel(s){
  const v = String(s || "").toLowerCase();
  if (v === "paid") return "Pago";
  if (v === "cancelled") return "Cancelado";
  if (v === "shipped") return "Enviado";
  if (v === "delivered") return "Entregue";
  return "Pendente";
}

function brl(n){
  return Number(n || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function safeParseItems(items){
  // aceita array (correto) OU string JSON (se tiver salvo como string)
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatDate(ts){
  // createdAt pode vir como unix seconds (1700000000)
  const num = Number(ts || 0);
  if (!num) return "";
  const ms = num < 10_000_000_000 ? num * 1000 : num; // se já vier em ms
  const d = new Date(ms);
  return d.toLocaleDateString("pt-BR");
}

function card(orderId, data){
  const items = safeParseItems(data.items);
  const itemsText = items.length
    ? items.slice(0,3).map(i => `${i.qty ?? 1}x ${i.name ?? "Item"}`).join(" • ")
    : "Itens não detalhados";

  const html = `
    <div style="
      border:1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.22);
      border-radius: 16px;
      padding: 14px;
    ">
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="font-weight:700;">Pedido #${orderId.slice(0,8).toUpperCase()}</div>
        <div style="color: rgba(255,255,255,.72); font-size:13px;">
          ${formatDate(data.createdAt)}
        </div>
      </div>

      <div style="margin-top:8px; color: rgba(255,255,255,.86);">
        <div style="margin-bottom:6px;">
          <span style="opacity:.75;">Status:</span>
          <span style="font-weight:700;">${statusLabel(data.status)}</span>
        </div>

        <div style="opacity:.85; font-size:14px; line-height:1.35;">
          ${itemsText}
        </div>

        <div style="margin-top:10px; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div><span style="opacity:.75;">Total:</span> <b>${brl(data.total)}</b></div>
          <a class="btn" href="/cliente/pedido/?id=${encodeURIComponent(orderId)}"
             style="text-decoration:none; display:inline-block; padding:10px 12px; border-radius:12px;">
            Ver detalhes
          </a>
        </div>
      </div>
    </div>
  `;
  return html;
}

watchAuth(async (user) => {
  if (!user) {
    window.location.href = "/cliente/login/";
    return;
  }

  try{
    sub.textContent = `Logado como ${user.email}. Buscando pedidos...`;

    const q = query(
      collection(db, "orders"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snap = await getDocs(q);

    if (snap.empty){
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
    snap.forEach(doc => {
      html += card(doc.id, doc.data());
    });

    list.innerHTML = html;

  }catch(err){
    console.error(err);
    sub.textContent = "Não foi possível carregar seus pedidos.";
    list.innerHTML = `
      <div class="msg" style="display:block;">
        Erro ao buscar pedidos. Verifique as regras do Firestore e tente novamente.
      </div>
    `;
  }
});