// /js/blogFirebase.js
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  addDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Ajuste este import se seu firebase.js estiver em outro caminho
import { db } from "./firebase.js";

const COL = "posts";

// PUBLIC
export async function listPosts({ status = "published" } = {}){
  const ref = collection(db, COL);
  const q = query(ref, where("status", "==", status), orderBy("publishedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPostBySlug(slug){
  const ref = collection(db, COL);
  const q = query(ref, where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ADMIN
export async function listPostsAdmin(){
  const ref = collection(db, COL);
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPostById(id){
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() }) : null;
}

export async function createPost(payload){
  const ref = collection(db, COL);
  const now = serverTimestamp();
  const docRef = await addDoc(ref, {
    ...payload,
    createdAt: now,
    updatedAt: now,
    publishedAt: payload.status === "published" ? now : null
  });
  return docRef.id;
}

export async function updatePost(id, payload){
  const ref = doc(db, COL, id);
  const now = serverTimestamp();

  // se o post está sendo publicado agora e não tem publishedAt, seta
  const willPublish = payload.status === "published";
  await updateDoc(ref, {
    ...payload,
    updatedAt: now,
    ...(willPublish ? { publishedAt: payload.publishedAt || now } : { publishedAt: null })
  });
}

export async function removePost(id){
  const ref = doc(db, COL, id);
  await deleteDoc(ref);
}
