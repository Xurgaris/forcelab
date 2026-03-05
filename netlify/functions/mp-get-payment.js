export async function handler(event) {
  try {
    // ✅ aceita GET
    if (event.httpMethod !== "GET") {
      return json(405, { ok: false, error: "Method Not Allowed (use GET)" });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return json(500, { ok: false, error: "MP_ACCESS_TOKEN não configurado" });

    const q = event.queryStringParameters || {};
    const paymentId = q.paymentId;

    if (!paymentId) return json(400, { ok: false, error: "paymentId ausente" });

    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return json(resp.status, { ok: false, error: "MP API recusou", details: data });

    return json(200, {
      ok: true,
      id: data.id,
      status: data.status, // approved/pending/rejected...
      status_detail: data.status_detail,
      payment_method_id: data.payment_method_id,
    });
  } catch (e) {
    return json(500, { ok: false, error: "Function crash", message: e.message });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}