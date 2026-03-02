// netlify/functions/mp-create-payment.js

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: "MP_ACCESS_TOKEN não configurado no Netlify." }),
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const { orderId, amount, formData, customer } = payload || {};

    if (!orderId || !amount || !formData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Payload inválido: precisa de orderId, amount e formData." }),
      };
    }

    // Campos que normalmente vêm do Brick
    const token = formData.token;
    const payment_method_id = formData.payment_method_id;
    const installments = Number(formData.installments || 1);

    const payerEmail = (customer && customer.email) ? customer.email : "test_user_123456@testuser.com";

    if (!payment_method_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "formData.payment_method_id não veio do Brick." }),
      };
    }

    // cartão geralmente exige token
    if (!token && payment_method_id !== "pix") {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "formData.token não veio do Brick (cartão)." }),
      };
    }

    const mpBody = {
      transaction_amount: Number(Number(amount).toFixed(2)),
      token: token || undefined,
      description: `Pedido ${orderId}`,
      installments,
      payment_method_id,
      payer: { email: payerEmail },
      external_reference: String(orderId),
      notification_url: process.env.MP_WEBHOOK_URL || undefined,
    };

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mpBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: data?.message || "Mercado Pago error",
          details: data,
        }),
      };
    }

    const pixData = data?.point_of_interaction?.transaction_data;
    const pix = pixData?.qr_code_base64
      ? { qr_code_base64: pixData.qr_code_base64, qr_code: pixData.qr_code }
      : null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        paymentId: data.id,
        status: data.status,
        paymentMethod: data.payment_method_id,
        pix,
      }),
    };
  } catch (err) {
    console.error("mp-create-payment error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err?.message || err) }),
    };
  }
};