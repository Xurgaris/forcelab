

  // /cliente/_shared/auth.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// ⚠️ Coloque seu firebaseConfig aqui (o mesmo do seu firebase.js)
// (pode manter oculto publicamente se quiser, mas em front-end ele sempre vai existir)
const firebaseConfig = {
   apiKey: "AIzaSyA7nEeM0RAJ77HS-bvq84rpAbvV4IGosEw",
  authDomain: "forcelabnutrition-afaa7.firebaseapp.com",
  projectId: "forcelabnutrition-afaa7",

  // ✅ CORRETO
  storageBucket: "forcelabnutrition-afaa7.appspot.com",

  messagingSenderId: "355893469293",
  appId: "1:355893469293:web:020fbced4dd761dc9d9f64",
};

// evita inicializar duas vezes
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ AQUI é onde nasce o auth (o seu erro é porque isso não existia)
export const auth = getAuth(app);

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function logout() {
  await signOut(auth);
}

export function requireAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}