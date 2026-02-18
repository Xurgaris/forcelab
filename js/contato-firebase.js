// /js/contato-firestore.js
import { db } from "./firebase.js";

import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const form = document.getElementById("contactForm");
const formMsg = document.getElementById("formMsg");
const btnSend = document.getElementById("btnSend");

function setMsg(msg, ok = true) {
  if (!formMsg) return;
  formMsg.textContent = msg || "";
  formMsg.style.color = ok ? "rgba(170,255,200,.95)" : "rgba(255,170,170,.95)";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("cName")?.value.trim();
  const whats = document.getElementById("cWhats")?.value.trim();
  const email = document.getElementById("cEmail")?.value.trim();
  const message = document.getElementById("cMsg")?.value.trim();

  if (!name || !whats || !email || !message) {
    setMsg("Preencha todos os campos.", false);
    return;
  }

  btnSend && (btnSend.disabled = true);
  setMsg("Enviando...", true);

  try {
    await addDoc(collection(db, "contatos"), {
      name,
      whats,
      email,
      message,
      createdAt: serverTimestamp(),
      origin: "site"
    });

    form.reset();
    setMsg("Mensagem enviada ✅", true);
  } catch (err) {
    console.error(err);
    setMsg("Erro ao enviar. Verifique regras do Firestore.", false);
  } finally {
    btnSend && (btnSend.disabled = false);
  }
});
