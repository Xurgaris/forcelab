import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

async function carregarCatalogo() {
  const querySnapshot = await getDocs(collection(db, "produtos"));

  querySnapshot.forEach((doc) => {
    const p = doc.data();

    // Detecta categoria
    const row = document.getElementById(`row-${p.category}`);
    if (!row) return;

    // Card horizontal
    row.innerHTML += `
      <div class="catalog-card"
        onclick="window.location.href='product.html?id=${doc.id}'">
        
        <img src="${p.image}" />
        <h4>${p.name}</h4>
        <p>${p.desc.substring(0, 45)}...</p>
        <strong>R$ ${p.price.toFixed(2)}</strong>
      </div>
    `;
  });
}

carregarCatalogo();
