import { signupEmail, loginGoogle } from "../_shared/auth.js";
import { db } from "/js/firebase.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const form = document.getElementById("formSignup");
const msg = document.getElementById("msg");
const btnGoogle = document.getElementById("btnGoogle");
const btnCreate = document.getElementById("btnCreate");

const $ = (id) => document.getElementById(id);

function show(text, ok=true){
  msg.style.display = "block";
  msg.textContent = text;
  msg.style.borderColor = ok ? "rgba(60,255,160,.25)" : "rgba(255,80,80,.25)";
  msg.style.background = ok ? "rgba(60,255,160,.08)" : "rgba(255,80,80,.08)";
}

function cleanPhone(v){
  return String(v||"").replace(/\D/g,"");
}

function getPrefillEmail(){
  const p = new URLSearchParams(location.search);
  return (p.get("email") || "").trim();
}

async function upsertUserProfile(user, extra = {}) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email || "",
    nome: user.displayName || extra.nome || "",
    whatsapp: extra.whatsapp || "",
    provider: user.providerData?.[0]?.providerId || "password",
    emailVerified: !!user.emailVerified,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

(function prefill(){
  const email = getPrefillEmail();
  if (email) $("email").value = email;
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = $("nome").value.trim();
  const whatsapp = cleanPhone($("whatsapp").value);
  const email = $("email").value.trim().toLowerCase();
  const senha = $("senha").value;
  const senha2 = $("senha2").value;
  const terms = $("terms").checked;

  if (!terms) return show("Você precisa aceitar os termos.", false);
  if (!nome) return show("Informe seu nome.", false);
  if (whatsapp.length < 10) return show("WhatsApp inválido.", false);
  if (senha.length < 6) return show("A senha precisa ter pelo menos 6 caracteres.", false);
  if (senha !== senha2) return show("As senhas não conferem.", false);

  try{
    btnCreate.disabled = true;

    const user = await signupEmail({ nome, email, senha });
    await upsertUserProfile(user, { nome, whatsapp });

    // manda pra tela de verificação
    location.href = "/cliente/verificar-email/";
  }catch(err){
    console.error(err);
    const code = String(err?.code || "");
    if (code.includes("auth/email-already-in-use")) {
      show("Esse e-mail já tem conta. Faça login.", false);
    } else if (code.includes("auth/weak-password")) {
      show("Senha fraca. Use pelo menos 6 caracteres.", false);
    } else {
      show(err?.message || "Não foi possível criar a conta.", false);
    }
  }finally{
    btnCreate.disabled = false;
  }
});

btnGoogle?.addEventListener("click", async () => {
  try{
    btnGoogle.disabled = true;

    const user = await loginGoogle();
    await upsertUserProfile(user, {});

    // Se entrou com Google, vai pro painel (e completar dados lá)
    location.href = "/cliente/conta/#dados";
  }catch(err){
    console.error(err);
    show(err?.message || "Não foi possível entrar com Google.", false);
  }finally{
    btnGoogle.disabled = false;
  }
});