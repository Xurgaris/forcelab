import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ============================
   PEGAR TODOS PRODUTOS
============================ */
export async function getAllProducts() {
  const snap = await getDocs(collection(db, "produtos"));

  let products = [];
  snap.forEach((doc) => {
    products.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return products;
}

/* ============================
   PEGAR PRODUTO INDIVIDUAL
============================ */
export async function getProductById(id) {
  const products = await getAllProducts();
  return products.find((p) => p.id === id);
}

/* ============================
   PEGAR DESTAQUES (featured)
============================ */
export async function getFeaturedProducts() {
  const q = query(
    collection(db, "produtos"),
    where("featured", "==", true)
  );

  const snap = await getDocs(q);

  let products = [];
  snap.forEach((doc) => {
    products.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return products;
}
