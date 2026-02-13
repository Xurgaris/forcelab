import { auth, db } from "../js/firebase.js";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import {
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

/* ================================
   PROTEÇÃO
================================ */

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadProducts();
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
   CADASTRAR PRODUTO
================================ */

const form = document.getElementById("productForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let nome = document.getElementById("nome").value;
  let preco = parseFloat(document.getElementById("preco").value);
  let imagem = document.getElementById("imagem").value;

  await addDoc(collection(db, "produtos"), {
    nome,
    preco,
    imagem,
  });

  alert("Produto cadastrado com sucesso!");

  form.reset();
});

/* ================================
   LISTAR PRODUTOS
================================ */

function loadProducts() {
  const box = document.getElementById("productsBox");

  onSnapshot(collection(db, "produtos"), (snapshot) => {
    box.innerHTML = "";

    snapshot.forEach((docSnap) => {
      let produto = docSnap.data();
      let id = docSnap.id;

      box.innerHTML += `
        <div class="cart-row">

          <img src="${produto.imagem}" width="70" style="border-radius:10px;" />

          <div style="flex:1;">
            <h3>${produto.nome}</h3>
            <p>R$ ${produto.preco.toFixed(2)}</p>
          </div>

          <button class="btn-outline" onclick="deleteProduct('${id}')">
            Apagar ❌
          </button>
        </div>
      `;
    });
  });
}

/* ================================
   DELETAR
================================ */

window.deleteProduct = async function (id) {
  if (confirm("Deseja apagar este produto?")) {
    await deleteDoc(doc(db, "produtos", id));
    alert("Produto removido!");
  }
};
