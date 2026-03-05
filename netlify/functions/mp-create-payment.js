// netlify/functions/mp-create-payment.js
const { randomUUID } = require("crypto");

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

    const payerEmail =
      (customer?.email && String(customer.email).includes("@"))
        ? String(customer.email).trim()
        : "test@testuser.com"; // ✅ padrão de teste

    const payment_method_id = formData.payment_method_id || null;
    const payment_type_id = formData.payment_type_id || null;
    const token = formData.token || null;
    const installments = Math.max(1, Number(formData.installments || 1));

    if (!payment_method_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "formData.payment_method_id não veio do Brick.", debug: formData }),
      };
    }

    // Heurística pro Pix via brick:
    const isPixLike =
      payment_type_id === "bank_transfer" ||
      payment_method_id === "pix" ||
      String(payment_method_id).toLowerCase().includes("pix");

    // cartão/débito precisa token
    if (!isPixLike && !token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "formData.token não veio do Brick (cartão).", debug: formData }),
      };
    }

    const mpBody = {
      transaction_amount: Number(Number(amount).toFixed(2)),
      description: `Pedido ${orderId}`,
      payment_method_id,
      payer: { email: payerEmail },
      external_reference: String(orderId),
      notification_url: process.env.MP_WEBHOOK_URL || undefined,
    };

    if (!isPixLike) {
      mpBody.token = token;
      mpBody.installments = installments;
    }

    const idemKey = randomUUID();

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey,
      },
      body: JSON.stringify(mpBody),
    });

    const data = await res.json().catch(() => ({}));
    const xRequestId = res.headers.get("x-request-id") || null;

    console.log("MP status:", res.status, "x-request-id:", xRequestId);
    console.log("MP response body:", data);

    if (!res.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: data?.message || "Mercado Pago error",
          mp_status: res.status,
          x_request_id: xRequestId,
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