// js/success.js
const params = new URLSearchParams(location.search);
const id = params.get("id") || "";

const orderIdEl = document.getElementById("orderId");
const copyBtn = document.getElementById("copyId");
const whatsBtn = document.getElementById("whatsBtn");

if (orderIdEl) orderIdEl.textContent = id ? `#${id}` : "Pedido sem ID";

copyBtn?.addEventListener("click", async () => {
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    copyBtn.textContent = "Copiado!";
    setTimeout(() => (copyBtn.textContent = "Copiar"), 1200);
  } catch {
    alert("Não foi possível copiar. Copie manualmente: " + id);
  }
});

// Troque para o WhatsApp da ForceLab (com DDI/DDD)
const WHATS_NUMBER = "5599999999999";
const msg = encodeURIComponent(
  `Olá! Fiz um pedido na ForceLab. Código do pedido: ${id || "(sem id)"}.`
);
if (whatsBtn) whatsBtn.href = `https://wa.me/${WHATS_NUMBER}?text=${msg}`;
