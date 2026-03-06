// /cliente/_shared/auth.js
import {
  initializeApp,
  getApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7nEeM0RAJ77HS-bvq84rpAbvV4IGosEw",
  authDomain: "forcelabnutrition-afaa7.firebaseapp.com",
  projectId: "forcelabnutrition-afaa7",

  // ✅ CORRETO
  storageBucket: "forcelabnutrition-afaa7.appspot.com",

  messagingSenderId: "355893469293",
  appId: "1:355893469293:web:020fbced4dd761dc9d9f64",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
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

export async function signupEmail({ nome, email, senha }) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);

  // Nome no Auth (displayName)
  if (nome) {
    await updateProfile(cred.user, { displayName: nome });
  }

  // Dispara verificação de e-mail
  await sendEmailVerification(cred.user);

  return cred.user;
}

export async function loginEmail({ email, senha }) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}
