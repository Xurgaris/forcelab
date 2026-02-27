// /admin/protect.js
import { auth, db } from "/js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ✅ trava IMEDIATO pra evitar flash */
document.documentElement.classList.add("auth-lock");
document.body.classList.add("auth-lock");

function allow() {
  document.documentElement.classList.remove("auth-lock");
  document.body.classList.remove("auth-lock");
  document.documentElement.classList.add("auth-ok");
  document.body.classList.add("auth-ok");
}

function deny() {
  document.documentElement.classList.remove("auth-ok");
  document.body.classList.remove("auth-ok");
  location.replace("/admin/login.html");
}

onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) return deny();

    const snap = await getDoc(doc(db, "admins", user.uid));
    if (!snap.exists()) return deny();

    allow();
  } catch (e) {
    console.error("protect.js:", e);
    deny();
  }
});