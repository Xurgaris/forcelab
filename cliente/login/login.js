import { auth } from "../_shared/auth.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const form = document.getElementById("form");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("pass");
const msg = document.getElementById("msg");

const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnReset = document.getElementById("btnReset");

function showMessage(text){
  msg.style.display = "block";
  msg.textContent = text;
}

function setLoading(isLoading){
  btnLogin.disabled = isLoading;
  btnRegister.disabled = isLoading;
  btnReset.disabled = isLoading;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailEl.value.trim().toLowerCase();
  const pass = passEl.value;

  setLoading(true);
  try{
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = "/cliente/conta/";
  }catch(err){
    console.error(err);
    showMessage("Email ou senha inválidos. Tente novamente.");
  }finally{
    setLoading(false);
  }
});

btnRegister.addEventListener("click", async () => {
  const email = emailEl.value.trim().toLowerCase();
  const pass = passEl.value;

  if (!email || !pass) {
    showMessage("Preencha email e senha para criar a conta.");
    return;
  }

  setLoading(true);
  try{
    await createUserWithEmailAndPassword(auth, email, pass);
    window.location.href = "/cliente/conta/";
  }catch(err){
    console.error(err);
    if (String(err?.code).includes("auth/email-already-in-use")){
      showMessage("Esse email já tem conta. Clique em Entrar ou redefina a senha.");
    } else if (String(err?.code).includes("auth/weak-password")){
      showMessage("Senha fraca. Use pelo menos 6 caracteres.");
    } else {
      showMessage("Não foi possível criar a conta. Tente novamente.");
    }
  }finally{
    setLoading(false);
  }
});

btnReset.addEventListener("click", async () => {
  const email = emailEl.value.trim().toLowerCase();
  if (!email){
    showMessage("Digite seu email para receber o link de redefinição de senha.");
    return;
  }

  setLoading(true);
  try{
    await sendPasswordResetEmail(auth, email);
    showMessage("Pronto! Enviamos um email para redefinir sua senha.");
} catch (err) {
  console.error(err);
  const code = String(err?.code || "");
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    showMessage("Email ou senha incorretos.");
  } else if (code.includes("auth/user-not-found")) {
    showMessage("Conta não encontrada. Clique em 'Criar conta'.");
  } else if (code.includes("auth/too-many-requests")) {
    showMessage("Muitas tentativas. Aguarde um pouco e tente novamente.");
  } else {
    showMessage("Erro ao entrar. Tente novamente.");
  }
}
});