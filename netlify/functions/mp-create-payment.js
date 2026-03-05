export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: "MP_ACCESS_TOKEN não configurado" }) };
    }

    const baseUrl = process.env.URL || "http://localhost:8888";

    const body = JSON.parse(event.body || "{}");
    const { orderId, amount, formData, customer } = body;

    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "orderId ausente" }) };
    }
    const transaction_amount = Number(amount);
    if (!transaction_amount || transaction_amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "amount inválido" }) };
    }
    if (!formData) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "formData ausente (Brick)" }) };
    }

    // Brick normalmente manda snake_case. Mantemos defensivo:
    const payment_method_id = formData.payment_method_id || formData.paymentMethodId;
    if (!payment_method_id) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "payment_method_id ausente" }) };
    }

    const payerEmail = String(customer?.email || formData.payer?.email || "").trim();
    if (!payerEmail || !payerEmail.includes("@")) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "payer.email inválido" }) };
    }

    // (Opcional, mas ajuda a reduzir recusas)
    // Se você tiver CPF no form, passe aqui.
    // O Brick pode mandar identification dependendo da configuração:
    const identification =
      formData.payer?.identification ||
      formData.identification ||
      undefined;

    const description = `Pedido ForceLab #${orderId}`;

    // Payload base para ambos
    const payload = {
      transaction_amount,
      description,
      payment_method_id,
      payer: {
        email: payerEmail,
        ...(customer?.nome ? { first_name: String(customer.nome).split(" ")[0] } : {}),
        ...(identification ? { identification } : {}),
      },
      external_reference: String(orderId),
      notification_url: `${baseUrl}/.netlify/functions/mp-webhook`, // pode usar agora ou depois
      // statement_descriptor: "FORCELAB", // opcional (tem regras do MP)
    };

    // ============================
    // CARTÃO (crédito/débito)
    // ============================
    // Para cartão, o Brick manda token/issuer/installments.
    // Sem isso => 422.
    const hasCardToken = !!(formData.token || formData.card_token);

    if (hasCardToken) {
      payload.token = formData.token || formData.card_token;
      payload.installments = Number(formData.installments || 1);
      payload.issuer_id = formData.issuer_id ? String(formData.issuer_id) : undefined;

      // Às vezes vem assim (depende do Brick):
      if (formData.payer && formData.payer.identification) {
        payload.payer.identification = formData.payer.identification;
      }

      // Limpa undefined para não irritar a API
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      if (payload.payer) {
        Object.keys(payload.payer).forEach((k) => payload.payer[k] === undefined && delete payload.payer[k]);
      }
    }

    // ============================
    // PIX
    // ============================
    // Para Pix NÃO precisa token.
    // Só garantir payment_method_id="pix", transaction_amount, payer.email.
    // Alguns casos o MP exige first_name/last_name ou identification dependendo da conta/risco.
    if (payment_method_id === "pix") {
      // se tiver nome completo, tenta preencher last_name também
      if (customer?.nome) {
        const parts = String(customer.nome).trim().split(/\s+/);
        payload.payer.first_name = parts[0] || "Cliente";
        payload.payer.last_name = parts.slice(1).join(" ") || "ForceLab";
      }
      // Limpa undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      Object.keys(payload.payer).forEach((k) => payload.payer[k] === undefined && delete payload.payer[k]);
    }

    // Idempotência (evita cobrança duplicada se o Brick tentar de novo)
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

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // Log útil para você ver no Netlify Functions logs
      console.error("MP error:", resp.status, data);
      return {
        statusCode: resp.status,
        body: JSON.stringify({
          ok: false,
          error: "Mercado Pago recusou a requisição",
          details: data,
        }),
      };
    }

    // PIX QR
    let pix = null;
    const tx = data?.point_of_interaction?.transaction_data;
    if (payment_method_id === "pix" && tx?.qr_code_base64) {
      pix = {
        qr_code_base64: tx.qr_code_base64,
        qr_code: tx.qr_code,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        paymentId: data?.id || null,
        status: data?.status || null, // approved/pending/rejected
        paymentMethod: data?.payment_method_id || payment_method_id,
        pix,
      }),
    };
  } catch (e) {
    console.error("Function crash:", e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
}const isPix = payment_method_id === "pix";
const token = formData.token || formData.card_token;

if (!isPix) {
  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:"Cartão: token ausente (formData.token)" }) };
  }
  if (!formData.installments) {
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:"Cartão: installments ausente" }) };
  }
  // issuer_id às vezes vem vazio e causa recusa
  if (!formData.issuer_id) {
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:"Cartão: issuer_id ausente" }) };
  }
}