import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================================
   CHECKOUT FIREBASE - FORCE LAB
================================ */

const form = document.getElementById("checkoutForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Dados do cliente
  let nome = form.nome.value;
  let whatsapp = form.whatsapp.value;
  let endereco = form.endereco.value;
  let pagamento = form.pagamento.value;
  let obs = form.obs.value;

  // Carrinho
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Total do pedido
  let total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  try {
    // Salvar pedido no Firestore
    await addDoc(collection(db, "pedidos"), {
      cliente: nome,
      whatsapp: whatsapp,
      endereco: endereco,
      pagamento: pagamento,
      observacoes: obs,

      itens: cart,
      total: total,

      status: "Pendente",
      criadoEm: Timestamp.now(),
    });

    alert("Pedido enviado com sucesso 🚀");

    // Limpar carrinho
    localStorage.removeItem("cart");

    // Voltar para home
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
    alert("Erro ao enviar pedido. Verifique o console (F12).");
  }
});
