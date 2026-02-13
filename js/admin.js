function login(e) {
  e.preventDefault();

  let user = document.getElementById("user").value;
  let pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "1234") {
    localStorage.setItem("adminAuth", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Login incorreto!");
  }
}

function logout() {
  localStorage.removeItem("adminAuth");
  window.location.href = "login.html";
}

(function protect() {
  if (window.location.href.includes("dashboard")) {
    if (localStorage.getItem("adminAuth") !== "true") {
      window.location.href = "login.html";
    }
  }
})();
import { db, auth } from "../js/firebase.js";

import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// LISTAR PEDIDOS EM TEMPO REAL
const pedidosBox = document.getElementById("pedidos");

onSnapshot(collection(db, "pedidos"), (snapshot) => {
  pedidosBox.innerHTML = "";

  snapshot.forEach((doc) => {
    let pedido = doc.data();

    pedidosBox.innerHTML += `
      <div class="cart-row">
        <h3>${pedido.cliente}</h3>
        <p>Status: <strong>${pedido.status}</strong></p>
        <p>Pagamento: ${pedido.pagamento}</p>
        <small>${pedido.whatsapp}</small>
      </div>
    `;
  });
});
