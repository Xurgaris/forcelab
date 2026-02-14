import { db } from "../js/firebase.js";

import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const totalVendido = document.getElementById("totalVendido");
const pendentes = document.getElementById("pendentes");
const totalPedidos = document.getElementById("totalPedidos");

onSnapshot(collection(db, "pedidos"), (snapshot) => {
  let total = 0;
  let pending = 0;

  totalPedidos.innerHTML = snapshot.size;

  snapshot.forEach((docSnap) => {
    const pedido = docSnap.data();

    total += pedido.total;

    if (pedido.status.includes("Aguardando")) {
      pending++;
    }
  });

  totalVendido.innerHTML = `R$ ${total.toFixed(2)}`;
  pendentes.innerHTML = pending;
});
