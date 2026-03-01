import { watchAuth } from "./auth.js";

const loginBtn = document.getElementById("loginBtn");

watchAuth((user) => {
  if (!loginBtn) return;
  if (user) {
    loginBtn.textContent = "Minha conta";
    loginBtn.href = "/cliente/conta/";
  } else {
    loginBtn.textContent = "Entrar";
    loginBtn.href = "/cliente/login/";
  }
});