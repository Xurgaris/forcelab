import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ============================
   PEGAR TODOS PRODUTOS
============================ */
export async function getAllProducts() {
  const snap = await getDocs(collection(db, "produtos"));
  const products = [];
  snap.forEach((d) => products.push({ id: d.id, ...d.data() }));
  return products;
}

/* ============================
   PEGAR PRODUTO INDIVIDUAL
============================ */
export async function getProductById(id) {
  // opção 1: direto no doc (mais rápido e certo)
  const ref = doc(db, "produtos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* ============================
   PEGAR DESTAQUES (featured)
============================ */
export async function getFeaturedProducts() {
  const q = query(collection(db, "produtos"), where("featured", "==", true));
  const snap = await getDocs(q);
  const products = [];
  snap.forEach((d) => products.push({ id: d.id, ...d.data() }));
  return products;
}
