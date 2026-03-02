// Inicia animação
const stopAnim = startStepSequence();

// Se tiver Pix, abre modal com QR
if (data.pix?.qr_code_base64) {
  openPixModal({
    qr_code_base64: data.pix.qr_code_base64,
    qr_code: data.pix.qr_code
  });
}

// ⚠️ padronize: backend deve retornar paymentId
const paymentId = data.paymentId || data.payment_id;
if (!paymentId) {
  stopAnim();
  setStep("Erro no pagamento", "Não recebi o paymentId do servidor.", 0);
  return;
}

// Consulta status
const result = await pollPaymentStatus(paymentId);

// Para animação
stopAnim();

if (result.ok) {
  setDone("Pagamento realizado ✅", "Pedido confirmado! Obrigado.");
  // Exemplo:
  // location.href = `success.html?id=${orderId}`;
} else {
  setStep(
    "Pagamento ainda não confirmado",
    "Se você já pagou, aguarde mais um pouco e tente novamente.",
    85
  );
}