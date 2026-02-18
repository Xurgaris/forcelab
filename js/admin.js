import { auth, db } from "../js/firebase.js";

import {
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ================================
   PROTEÇÃO
================================ */

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadDashboard();
  }
});

/* ================================
   LOGOUT
================================ */

window.logoutAdmin = async function () {
  await signOut(auth);
  window.location.href = "login.html";
};

/* ================================
   DASHBOARD
================================ */

function loadDashboard() {
  const ordersBox = document.getElementById("ordersBox");

  const totalPedidosEl = document.getElementById("totalPedidos");
  const pendentesEl = document.getElementById("pendentes");
  const totalProdutosEl = document.getElementById("totalProdutos");

  /* PEDIDOS */
  onSnapshot(collection(db, "pedidos"), (snapshot) => {
    ordersBox.innerHTML = "";

    let totalPedidos = snapshot.size;
    let pendentes = 0;

    snapshot.forEach((docSnap) => {
      let pedido = docSnap.data();
      let id = docSnap.id;

      if (pedido.status === "Pendente") pendentes++;

      ordersBox.innerHTML += `
        <div class="order-item">
          <h4>👤 ${pedido.cliente}</h4>
          <p>Total: <strong>R$ ${pedido.total.toFixed(2)}</strong></p>
          <p>Status: <strong>${pedido.status}</strong></p>

          <div class="order-actions">
            <button class="btn-admin" onclick="updateStatus('${id}','Pago')">
              Pago ✅
            </button>

            <button class="btn-admin" onclick="updateStatus('${id}','Enviado')">
              Enviado 🚚
            </button>

            <a class="btn-outline"
              target="_blank"
              href="https://wa.me/55${pedido.whatsapp.replace(/\D/g, "")}">
              WhatsApp 💬
            </a>
          </div>
        </div>
      `;
    });

    totalPedidosEl.innerText = totalPedidos;
    pendentesEl.innerText = pendentes;
  });

  /* PRODUTOS */
  onSnapshot(collection(db, "produtos"), (snapshot) => {
    totalProdutosEl.innerText = snapshot.size;
  });
}

/* ================================
   STATUS UPDATE
================================ */

window.updateStatus = async function (id, status) {
  await updateDoc(doc(db, "pedidos", id), {
    status: status,
  });

  alert("Status atualizado: " + status);
};
