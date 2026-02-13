import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================================
   PEGAR FORM
================================ */

const form = document.querySelector(".checkout-form");

/* ================================
   ENVIAR PEDIDO FIRESTORE
================================ */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Dados do cliente
  const nome = form.nome.value;
  const whatsapp = form.whatsapp.value;
  const endereco = form.endereco.value;
  const pagamento = form.pagamento.value;
  const obs = form.obs.value;

  // Carrinho salvo
  const carrinho =
    JSON.parse(localStorage.getItem("cart")) || [];

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Total calculado
  let total = 0;
  carrinho.forEach((item) => {
    total += item.price * item.qty;
  });

  /* ================================
     SALVAR NO FIRESTORE
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

    alert("Pedido enviado com sucesso! 🚀");

    // Limpar carrinho
    localStorage.removeItem("cart");

    // Redirecionar
    window.location.href = "success.html";
  } catch (err) {
    alert("Erro ao enviar pedido ❌");
    console.error(err);
  }
});
