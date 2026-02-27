import { auth } from "../_shared/auth.js";
import { sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const form = document.getElementById("form");
const emailInput = document.getElementById("email");
const btnSend = document.getElementById("btnSend");
const msg = document.getElementById("msg");

function showMessage(text){
  msg.style.display = "block";
  msg.textContent = text;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;

  btnSend.disabled = true;

  try{
    // IMPORTANTE:
    // - esse link precisa apontar para uma rota sua que carregue auth.js
    // - pode ser a própria página de login, ou /cliente/conta/
    const actionCodeSettings = {
      url: "https://forcelabnutrition.com.br/cliente/conta/",
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    window.localStorage.setItem("forcelab_login_email", email);
    showMessage("Link enviado! Verifique seu email (e a caixa de spam).");
  } catch (err) {
    console.error(err);
    showMessage("Erro ao enviar o link. Confira o email e tente novamente.");
  } finally {
    btnSend.disabled = false;
  }
});