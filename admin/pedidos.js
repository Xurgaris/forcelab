import { db } from "../js/firebase.js";

import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const lista = document.getElementById("listaPedidos");

onSnapshot(collection(db, "pedidos"), (snapshot) => {
  lista.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const pedido = docSnap.data();

    // ✅ Garantia de carrinho
    const carrinho = pedido.carrinho || [];

    // Produtos formatados
    let produtosHTML = "";

    if (carrinho.length === 0) {
      produtosHTML = "<li>⚠ Nenhum produto registrado</li>";
    } else {
      carrinho.forEach((p) => {
        produtosHTML += `
          <li>
            ${p.name} — ${p.qty}x (R$ ${p.price})
          </li>
        `;
      });
    }

    lista.innerHTML += `
      <div style="
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,0,0,0.25);
        padding: 25px;
        border-radius: 20px;
        margin-bottom: 25px;
      ">

        <h2 style="color:red;">🧾 Pedido de: ${pedido.nome || "Sem nome"}</h2>

        <p><b>📅 Data:</b> ${pedido.data || "Não registrada"}</p>
        <p><b>📞 WhatsApp:</b> ${pedido.whatsapp || "Não informado"}</p>
        <p><b>📍 Endereço:</b> ${pedido.endereco || "Não informado"}</p>

        <p><b>💳 Pagamento:</b> ${pedido.pagamento || "Não definido"}</p>
        <p><b>📝 Observações:</b> ${pedido.obs || "Nenhuma"}</p>

        <hr style="opacity:0.2; margin:15px 0;">

        <h3>🛒 Produtos:</h3>
        <ul style="padding-left:20px;">
          ${produtosHTML}
        </ul>

        <h2 style="color:red; margin-top:15px;">
          Total: R$ ${(pedido.total || 0).toFixed(2)}
        </h2>

        <p><b>Status:</b> ${pedido.status || "Sem status"}</p>

        <a
          href="https://wa.me/55${pedido.whatsapp || ""}"
          target="_blank"
          style="
            display:inline-block;
            margin-top:15px;
            padding:12px 18px;
            background:red;
            color:white;
            border-radius:14px;
            text-decoration:none;
            font-weight:bold;
          "
        >
          💬 WhatsApp Cliente
        </a>
      </div>
    `;
  });
});
