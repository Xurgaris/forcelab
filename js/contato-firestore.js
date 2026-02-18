import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const form = document.getElementById("contactForm");
const btnSend = document.getElementById("btnSend");
const formMsg = document.getElementById("formMsg");

function setMsg(msg, ok = true) {
  if (!formMsg) return;
  formMsg.textContent = msg || "";
  formMsg.style.color = ok ? "rgba(170,255,200,.95)" : "rgba(255,170,170,.95)";
}

form?.addEventListener("submit", async (e) => {
  // IMPORTANTE: impede o Netlify de "trocar de página" antes do Firestore salvar
  e.preventDefault();

  const name = document.getElementById("nomeContato")?.value.trim();
  const whats = document.getElementById("whatsContato")?.value.trim();
  const email = document.getElementById("emailContato")?.value.trim();
  const message = document.getElementById("msgContato")?.value.trim();

  if (!name || !whats || !email || !message) {
    setMsg("Preencha todos os campos.", false);
    return;
  }

  btnSend && (btnSend.disabled = true);
  setMsg("Enviando...", true);

  try {
    // 1) SALVA NO FIRESTORE
    await addDoc(collection(db, "contatos"), {
      name,
      whats,
      email,
      message,
      createdAt: serverTimestamp(),
      origin: "site",
    });

    // 2) ENVIA PRO NETLIFY FORMS (opcional, mas você já usa)
    const fd = new FormData(form);
    await fetch("/", {
      method: "POST",
      body: fd,
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
