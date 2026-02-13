import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================================
   CONFIGS
================================ */

// WhatsApp da LOJA (coloque o número real)
const whatsappLoja = "5566999999999";

// Chave Pix da empresa
const pixKey = "00000000000";

/* ================================
   PEGAR FORM
================================ */

const form = document.querySelector(".checkout-form");

/* ================================
   ENVIAR PEDIDO
================================ */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Dados do cliente
  const nome = form.nome.value;
  const whatsapp = form.whatsapp.value;
  const endereco = form.endereco.value;
  const pagamento = form.pagamento.value;
  const obs = form.obs.value;

  // Carrinho
  const carrinho =
    JSON.parse(localStorage.getItem("cart")) || [];

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Total
  let total = 0;
  carrinho.forEach((item) => {
    total += item.price * item.qty;
  });

  /* ================================
     TEXTO WHATSAPP
  ================================ */

  let listaProdutos = "";
  carrinho.forEach((item) => {
    listaProdutos += `• ${item.name} (x${item.qty})%0A`;
  });

  const mensagemZap =
    `🔥 NOVO PEDIDO - ForceLab Nutrition 🔥%0A%0A` +
    `👤 Cliente: ${nome}%0A` +
    `📞 WhatsApp: ${whatsapp}%0A` +
    `📍 Endereço: ${endereco}%0A%0A` +
    `🛒 Produtos:%0A${listaProdutos}%0A` +
    `💰 Total: R$ ${total.toFixed(2)}%0A` +
    `💳 Pagamento: ${pagamento}%0A%0A` +
    `🔑 Pix: ${pixKey}%0A%0A` +
    `📝 Obs: ${obs}`;

  /* ================================
     SALVAR FIRESTORE
  ================================ */

  try {
    await addDoc(collection(db, "pedidos"), {
      cliente: nome,
      whatsapp: whatsapp,
      endereco: endereco,
      pagamento: pagamento,
      obs: obs,

      carrinho: carrinho,
      total: total,

      status: "Pendente",

      criadoEm: Timestamp.now(),
    });

    // Limpar carrinho
    localStorage.removeItem("cart");

    // Abrir WhatsApp automático
    window.open(
      `https://wa.me/${whatsappLoja}?text=${mensagemZap}`,
      "_blank",
    );

    // Redirecionar sucesso
    window.location.href = "success.html";
  } catch (err) {
    alert("Erro ao enviar pedido ❌");
    console.error(err);
  }
});
