/**
 * İstemciden telemetri gönderimi.
 *
 * `sendBeacon` sayfa kapanırken de çalışır; yoksa keepalive fetch'e düşer.
 * Gönderim asla akışı bloke etmez ve asla hata fırlatmaz — ölçüm altyapısının
 * bozulması kullanıcının işini durdurmamalı.
 */

export type Report =
  | { kind: "web-vital"; name: string; value: number; rating?: string }
  | { kind: "client-error" | "unhandled-rejection"; message: string; stack?: string };

const ENDPOINT = "/api/telemetry";

export function report(payload: Report): void {
  try {
    const body = JSON.stringify({
      ...payload,
      path: typeof location !== "undefined" ? location.pathname : undefined,
      release: process.env.NEXT_PUBLIC_RELEASE ?? "dev",
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {});
  } catch {
    /* ölçüm hiçbir koşulda uygulamayı bozmaz */
  }
}
