import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 2) Finalizar login quando usuário clicar no link do email
(async function finishEmailLinkSignIn(){
  try{
    const url = window.location.href;
    if (!isSignInWithEmailLink(auth, url)) return;

    const savedEmail = window.localStorage.getItem("forcelab_login_email");
    let email = savedEmail;

    // Se o usuário abriu o link em outro dispositivo e não tem email salvo
    if (!email) email = window.prompt("Confirme seu email para concluir o login:");

    if (!email) return;

    await signInWithEmailLink(auth, email, url);
    window.localStorage.removeItem("forcelab_login_email");

    // limpa query params do link
    window.history.replaceState({}, document.title, "/cliente/conta/");
    window.location.href = "/cliente/conta/";
  } catch (err) {
    console.error(err);
    alert("Não foi possível concluir o login. Tente novamente.");
  }
})();

// 3) helpers (opcional)
export function watchAuth(cb){
  return onAuthStateChanged(auth, cb);
}

export async function logout(){
  await signOut(auth);
}