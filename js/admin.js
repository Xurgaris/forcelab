import { auth, db } from "../js/firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================================
   LOGIN ADMIN
================================ */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert("Login realizado com sucesso!");
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Erro no login: " + err.message);
    }
  });
}

/* ================================
   PROTEÇÃO DO DASHBOARD
================================ */

onAuthStateChanged(auth, (user) => {
  if (window.location.href.includes("dashboard")) {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadOrders();
    }
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
   LISTAR PEDIDOS EM TEMPO REAL
================================ */

function loadOrders() {
  const ordersBox = document.getElementById("ordersBox");

  onSnapshot(collection(db, "pedidos"), (snapshot) => {
    ordersBox.innerHTML = "";

    snapshot.forEach((docSnap) => {
      let pedido = docSnap.data();
      let id = docSnap.id;

      ordersBox.innerHTML += `
        <div class="cart-row" style="flex-direction:column; align-items:flex-start;">
          
          <h3 style="color:var(--primary)">
            👤 ${pedido.cliente}
          </h3>

          <p>📞 WhatsApp: ${pedido.whatsapp}</p>
          <p>📍 Endereço: ${pedido.endereco}</p>
          <p>💳 Pagamento: <strong>${pedido.pagamento}</strong></p>

          <p>
            📦 Status:
            <strong style="color:yellow">${pedido.status}</strong>
          </p>

          <p style="margin-top:10px;">
            💰 Total: <strong style="color:red">R$ ${pedido.total.toFixed(
              2
            )}</strong>
          </p>

          <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
            
            <button class="btn-main" onclick="updateStatus('${id}','Pago')">
              Marcar como Pago ✅
            </button>

            <button class="btn-main" onclick="updateStatus('${id}','Enviado')">
              Marcar como Enviado 🚚
            </button>

            <a class="btn-outline"
              target="_blank"
              href="https://wa.me/55${pedido.whatsapp.replace(
                /\D/g,
                ""
              )}">
              Abrir WhatsApp 💬
            </a>

          </div>
        </div>
      `;
    });
  });
}

/* ================================
   ATUALIZAR STATUS
================================ */

window.updateStatus = async function (id, status) {
  const ref = doc(db, "pedidos", id);

  await updateDoc(ref, {
    status: status,
  });

  alert("Status atualizado para: " + status);
};
