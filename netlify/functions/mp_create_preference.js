export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { items, payer } = JSON.parse(event.body || "{}");

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Itens inválidos" }) };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return { statusCode: 500, body: JSON.stringify({ error: "MP_ACCESS_TOKEN não configurado" }) };
    }

    const baseUrl =
      process.env.URL || "http://localhost:8888"; // Netlify injecta URL em prod

    const preference = {
      items: items.map((it) => ({
        title: it.title,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price),
        currency_id: "BRL",
      })),
      payer: payer
        ? {
            email: payer.email,
            name: payer.name,
          }
        : undefined,

      // URLs do seu site
      back_urls: {
        success: `${baseUrl}/checkout-success.html`,
        pending: `${baseUrl}/checkout-pending.html`,
        failure: `${baseUrl}/checkout-failure.html`,
      },
      auto_return: "approved",

      // Webhook (IPN) para confirmar pagamento
      notification_url: `${baseUrl}/.netlify/functions/mp_webhook`,

      // opcional: referência do seu pedido (salve isso no seu DB também)
      external_reference: `order_${Date.now()}`,
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}