import { auth } from "../js/firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";


window.login = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);

    alert("Login feito com sucesso ✅");

    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Erro no login ❌");
  }
};
