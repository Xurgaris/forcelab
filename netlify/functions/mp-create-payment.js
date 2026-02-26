// data.payment_id precisa vir do backend
const stopAnim = startStepSequence();

if (data.pix?.qr_code_base64) {
  openPixModal({ qr_code_base64: data.pix.qr_code_base64, qr_code: data.pix.qr_code });
}

const result = await pollPaymentStatus(data.payment_id);

stopAnim();

if (result.ok) {
  setDone("Pagamento realizado ✅", "Pedido confirmado! Obrigado.");
  // aqui você pode: location.href = `success.html?id=${orderId}`
} else {
  setStep("Pagamento ainda não confirmado", "Se você já pagou, aguarde mais um pouco e tente novamente.", 85);
  // opcional: manter overlay aberto e mostrar botão "Verificar novamente"
}