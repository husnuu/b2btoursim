import { normalizeApplication, validateApplication } from "@/lib/landing/application";

/**
 * Başvuru formu uç noktası.
 *
 * Henüz bir CRM / e-posta / veritabanı bağlantısı yok. `APPLICATION_WEBHOOK_URL`
 * tanımlıysa doğrulanmış başvuru o adrese JSON olarak iletilir (Zapier, Make,
 * Slack, n8n, kendi API'niz vb.). Tanımlı değilse 503 döner ve form kullanıcıya
 * başvurunun iletilmediğini açıkça söyler — sahte başarı mesajı gösterilmez.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = normalizeApplication(body);
  const errors = validateApplication(input);
  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "validation", fields: errors }, { status: 422 });
  }

  const webhook = process.env.APPLICATION_WEBHOOK_URL;
  if (!webhook) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, submittedAt: new Date().toISOString(), source: "seyyah-landing" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
  } catch (err) {
    console.error("[basvuru] iletim başarısız", err);
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
