import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================================
   GRID DA HOME
================================ */

const productsGrid = document.getElementById("productsGrid");

/* ================================
   LISTAR PRODUTOS AUTOMÁTICOS
================================ */

onSnapshot(collection(db, "produtos"), (snapshot) => {
  productsGrid.innerHTML = "";

  if (snapshot.empty) {
    productsGrid.innerHTML = `
      <p style="opacity:0.6;">
        Nenhum produto cadastrado ainda.
      </p>
    `;
    return;
  }

  snapshot.forEach((docSnap) => {
    const produto = docSnap.data();

    productsGrid.innerHTML += `
      <div class="card">
        <img src="${produto.imagem}" alt="${produto.nome}" />

        <h3>${produto.nome}</h3>

        <p class="price">
          R$ ${produto.preco.toFixed(2)}
        </p>

        <button onclick="addToCart(
          '${produto.nome}',
          ${produto.preco},
          '${produto.imagem}'
        )">
          ADICIONAR
        </button>
      </div>
    `;
  });
});
