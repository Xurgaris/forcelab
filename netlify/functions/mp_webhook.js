export async function handler(event) {
  try {
    // o MP pode mandar query params ou body
    const q = event.queryStringParameters || {};
    let b = {};
    try { b = JSON.parse(event.body || "{}"); } catch {}

    const type = q.type || q.topic || b.type;
    const dataId = q["data.id"] || q.id || b?.data?.id;

    // Sempre responder 200
    if (!dataId) return { statusCode: 200, body: "OK" };

    // Aqui você consultaria /v1/payments/{id} e atualizaria Firestore,
    // mas pra atualizar Firestore do backend você precisa Firebase Admin (service account)
    // então deixei como log:
    console.log("Webhook recebido:", { type, dataId });

    return { statusCode: 200, body: "OK" };
  } catch (e) {
    return { statusCode: 200, body: "OK" };
  }
}