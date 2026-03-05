export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return json(500, { ok: false, error: "MP_ACCESS_TOKEN não configurado no Netlify" });
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "JSON inválido no body" });
    }

    const orderId = body.orderId;
    const amount = Number(body.amount);
    const formData = body.formData || {};
    const customer = body.customer || {};

    if (!orderId) return json(400, { ok: false, error: "orderId ausente" });
    if (!amount || amount <= 0) return json(400, { ok: false, error: "amount inválido" });

    const payment_method_id = formData.payment_method_id || formData.paymentMethodId;
    if (!payment_method_id) return json(400, { ok: false, error: "payment_method_id ausente" });

    const payerEmail = String(customer.email || formData?.payer?.email || "").trim();
    if (!payerEmail || !payerEmail.includes("@")) {
      return json(400, { ok: false, error: "payer.email inválido/ausente" });
    }

    const baseUrl = process.env.URL || "https://forcelabnutrition.com.br";
    const isPix = payment_method_id === "pix";

    // token do cartão pode vir em lugares diferentes
    const token =
      formData.token ||
      formData.card_token ||
      formData?.cardFormData?.token ||
      formData?.cardFormData?.card_token;

    // validações cartão
    if (!isPix) {
      if (!token) return json(400, { ok: false, error: "Cartão: token ausente (Card Token não encontrado)" });

      if (!formData.installments) return json(400, { ok: false, error: "Cartão: installments ausente" });
      if (!formData.issuer_id) return json(400, { ok: false, error: "Cartão: issuer_id ausente" });
    }

    const payload = {
      transaction_amount: Number(amount.toFixed(2)),
      description: `Pedido ForceLab #${orderId}`,
      payment_method_id,
      payer: { email: payerEmail },
      external_reference: String(orderId),
      notification_url: `${baseUrl}/.netlify/functions/mp-webhook`,
    };

    if (!isPix) {
      payload.token = token;
      payload.installments = Number(formData.installments);
      payload.issuer_id = String(formData.issuer_id);

      const identification = formData?.payer?.identification || formData?.identification;
      if (identification) payload.payer.identification = identification;
    } else {
      // Pix: se tiver nome, ajuda
      if (customer?.nome) {
        const parts = String(customer.nome).trim().split(/\s+/);
        payload.payer.first_name = parts[0] || "Cliente";
        payload.payer.last_name = parts.slice(1).join(" ") || "ForceLab";
      }
    }

    const idemKey = `order_${orderId}_${Date.now()}`;

    const resp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      return json(resp.status, { ok: false, error: "MP API recusou", details: data });
    }

    let pix = null;
    const tx = data?.point_of_interaction?.transaction_data;
    if (isPix && tx?.qr_code_base64) {
      pix = { qr_code_base64: tx.qr_code_base64, qr_code: tx.qr_code };
    }

    return json(200, {
      ok: true,
      paymentId: data?.id || null,
      status: data?.status || null,
      paymentMethod: data?.payment_method_id || payment_method_id,
      pix,
    });
  } catch (e) {
    return json(500, { ok: false, error: "Function crash", message: String(e?.message || e) });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}