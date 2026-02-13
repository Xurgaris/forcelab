import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";


document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  let nome = e.target.nome.value;
  let whatsapp = e.target.whatsapp.value;
  let endereco = e.target.endereco.value;
  let pagamento = e.target.pagamento.value;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  await addDoc(collection(db, "pedidos"), {
    cliente: nome,
    whatsapp: whatsapp,
    endereco: endereco,
    pagamento: pagamento,
    itens: cart,
    status: "Pendente",
    criadoEm: Timestamp.now()
  });

  alert("Pedido enviado com sucesso!");

  localStorage.removeItem("cart");
  window.location.href = "index.html";
});
