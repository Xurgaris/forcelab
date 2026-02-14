import { db } from "./firebase.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const form = document.querySelector(".checkout-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 🔥 Captura total
  const dados = {
    nome: form.querySelector("[name='nome']").value.trim(),
    whatsapp: form.querySelector("[name='whatsapp']").value.trim(),
    endereco: form.querySelector("[name='endereco']").value.trim(),
    pagamento: form.querySelector("[name='pagamento']").value,
    obs: form.querySelector("[name='obs']").value.trim(),
  };

  console.log("🔥 DADOS DO CLIENTE:", dados);

  // Carrinho
  const carrinho = JSON.parse(localStorage.getItem("cart")) || [];

  let total = 0;
  carrinho.forEach((item) => {
    total += item.price * item.qty;
  });

  console.log("🛒 Carrinho:", carrinho);

  // Se nome estiver vazio, trava
  if (!dados.nome) {
    alert("Nome não foi capturado ❌");
    return;
  }

  try {
    await addDoc(collection(db, "pedidos"), {
      ...dados,
      carrinho,
      total,
      status: "Aguardando pagamento",
      data: new Date().toLocaleString("pt-br"),
    });

    alert("Pedido enviado com sucesso 🔥");

    localStorage.removeItem("cart");
    window.location.href = "success.html";
  } catch (err) {
    alert("Erro ao enviar pedido ❌");
    console.log(err);
  }
});
