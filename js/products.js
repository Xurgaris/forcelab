import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const grid = document.getElementById("productsGrid");

onSnapshot(collection(db, "produtos"), (snapshot) => {
  grid.innerHTML = "";

  snapshot.forEach((docSnap) => {
    let p = docSnap.data();

    grid.innerHTML += `
      <div class="product-card">
        <img src="${p.imagem}" />

        <h3>${p.nome}</h3>

        <p>R$ ${p.preco.toFixed(2)}</p>

        <button onclick="addToCart('${p.nome}', ${p.preco}, '${p.imagem}')">
          Adicionar ao Carrinho
        </button>
      </div>
    `;
  });
});
