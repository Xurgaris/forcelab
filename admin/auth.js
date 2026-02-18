// /admin/auth.js
import { auth } from "../js/firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import { db } from "../js/firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// garante login + garante admin (admins/{uid})
export function requireAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "login.html";
        return;
      }

      // checa se é admin (precisa existir admins/{uid})
      const ref = doc(db, "admins", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        document.body.innerHTML = `
          <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0b0b;color:#fff;font-family:Inter,system-ui">
            <div style="max-width:520px;padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)">
              <h2 style="margin:0 0 8px;font-weight:900">Sem permissão</h2>
              <p style="margin:0;color:rgba(255,255,255,.75);line-height:1.6">
                Seu usuário está autenticado, mas não está cadastrado como admin no Firestore.
                Crie o documento <b>admins/${user.uid}</b>.
              </p>
              <button id="logoutBtn" style="margin-top:14px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:transparent;color:#fff;font-weight:800;cursor:pointer">
                Sair
              </button>
            </div>
          </div>
        `;
        document.getElementById("logoutBtn")?.addEventListener("click", () => signOut(auth));
        return;
      }

      resolve(user);
    });
  });
}

export function bindLogout(selector = "[data-logout]") {
  document.querySelector(selector)?.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "login.html";
  });
}
