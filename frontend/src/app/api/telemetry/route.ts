import { log, requestIdFrom } from "@/lib/log";

/**
 * Tarayıcıdan gelen ölçüm ve hata kayıtlarını alır.
 *
 * Neden kendi ucumuz: üçüncü parti bir RUM script'i eklemek hem sayfaya
 * kilobayt hem de kullanıcı verisi üzerinde bizim kontrolümüzde olmayan bir
 * akış ekler. Burası satıcıdan bağımsız bir toplama noktası — arkasına
 * hangi toplayıcı bağlanırsa bağlansın istemci kodu değişmez.
 *
 * Gövde `sendBeacon` ile gelir; yanıtı kimse beklemez, o yüzden 204 döner.
 */

export const dynamic = "force-dynamic";

/** Kötü niyetli ya da bozuk gövde yüzünden log'u boğmayalım. */
const MAX_BODY_BYTES = 16 * 1024;

type Payload = {
  kind: "web-vital" | "client-error" | "unhandled-rejection";
  name?: string;
  value?: number;
  rating?: "good" | "needs-improvement" | "poor";
  path?: string;
  message?: string;
  stack?: string;
  release?: string;
};

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    log.warn("telemetry.rejected", { requestId, reason: "gövde çok büyük", size: raw.length });
    return new Response(null, { status: 413 });
  }

  let payload: Payload;
  try {
    payload = JSON.parse(raw) as Payload;
  } catch {
    log.warn("telemetry.rejected", { requestId, reason: "geçersiz JSON" });
    return new Response(null, { status: 400 });
  }

  const fields = {
    requestId,
    path: payload.path,
    release: payload.release,
    // Mesaj ve yığın `redact` üzerinden geçer: kullanıcı metni içerebilir.
    message: payload.message,
    stack: payload.stack,
  };

  if (payload.kind === "web-vital") {
    log.info("web_vital", {
      ...fields,
      metric: payload.name,
      value: payload.value,
      rating: payload.rating,
    });
  } else {
    log.error(
      payload.kind === "client-error" ? "client_error" : "unhandled_rejection",
      fields,
    );
  }

  return new Response(null, { status: 204, headers: { "x-request-id": requestId } });
}
