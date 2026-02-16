// /admin/login.js
import { auth } from "../js/firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const form = document.querySelector("#loginForm");
const msg = document.querySelector("#loginMsg");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "dashboard.html";
  } catch (err) {
    console.error(err);
    msg.textContent = "Email ou senha inválidos.";
  }
});
