import { requireAuth } from "./auth.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const db = getFirestore(getApp());

function getCartFromStorage() {
  try {
    const raw = localStorage.getItem("cart");
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function normalizeItems(cart) {
  return (cart || [])
    .map((i) => ({
      id: i?.id ?? null,
      type: i?.type || "product",
      name: String(i?.name || "Produto"),
      qty: Math.max(1, Number(i?.qty) || 1),
      price: Number(i?.price) || 0,
      image: i?.image || null
    }))
    .filter((i) => i.qty > 0 && i.price >= 0);
}

function calcTotal(items) {
  return items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
}

export async function createOrderFromCart() {
  const user = await requireAuth();
  if (!user) throw new Error("NOT_LOGGED");

  const cart = getCartFromStorage();
  const items = normalizeItems(cart);

  if (!items.length) throw new Error("EMPTY_CART");

  const total = calcTotal(items);

  const ref = await addDoc(collection(db, "orders"), {
    uid: user.uid,
    createdAt: serverTimestamp(),      // ✅ profissional
    status: "pending",
    items,
    total: Number(total.toFixed(2)),
    mpPreferenceId: null,
    mpPaymentId: null
  });

  // limpa carrinho
  localStorage.setItem("cart", "[]");
  window.dispatchEvent(new Event("cartUpdated"));

  return ref.id;
}