import { db } from "../js/firebase.js";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================================
   ADD PRODUTO
================================ */

window.addProduto = async function () {
  let nome = document.getElementById("nome").value;
  let preco = Number(document.getElementById("preco").value);
  let imagem = document.getElementById("imagem").value;

  if (!nome || !preco || !imagem) {
    alert("Preencha tudo!");
    return;
  }

  await addDoc(collection(db, "produtos"), {
    nome,
    preco,
    imagem,
  });

  alert("Produto cadastrado!");

  document.getElementById("nome").value = "";
  document.getElementById("preco").value = "";
  document.getElementById("imagem").value = "";
};

/* ================================
   LISTAR PRODUTOS
================================ */

const produtosBox = document.getElementById("produtosBox");

onSnapshot(collection(db, "produtos"), (snapshot) => {
  produtosBox.innerHTML = "";

  snapshot.forEach((docSnap) => {
    let produto = docSnap.data();

    produtosBox.innerHTML += `
      <div class="order-item">
        <h4>${produto.nome}</h4>
        <p>R$ ${produto.preco}</p>

        <button class="btn-outline"
          onclick="deleteProduto('${docSnap.id}')">
          ❌ Remover
        </button>
      </div>
    `;
  });
});

/* ================================
   DELETE PRODUTO
================================ */

window.deleteProduto = async function (id) {
  await deleteDoc(doc(db, "produtos", id));
};
