/**
 * Yapılandırılmış log.
 *
 * Üretimde stdout'a JSON satırı basar; hangi toplayıcıya bağlanırsa bağlansın
 * (Vercel Log Drains, Datadog, Loki, CloudWatch) ek kod gerekmez. Geliştirmede
 * okunabilir tek satır.
 *
 * KVKK / GDPR: bu ürün yolcu adı, e-posta ve telefon işliyor. Bu alanlar log'a
 * asla ham girmez — `redact` bilinen kişisel veri anahtarlarını maskeler ve
 * serbest metinde e-posta/telefon kalıplarını yakalar. Log toplayıcı sözleşmesi
 * ne olursa olsun kişisel veri sınırı burada, uygulama içinde çizilir.
 */

export type Level = "debug" | "info" | "warn" | "error";

/** Değeri hiçbir koşulda log'a girmeyecek alan adları. */
const PII_KEYS = new Set([
  "name",
  "leadname",
  "lead_name",
  "fullname",
  "email",
  "eposta",
  "e_posta",
  "phone",
  "telefon",
  "tel",
  "note",
  "not",
  "password",
  "token",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "secret",
  "cardnumber",
  "iban",
  "tckn",
  "passport",
  "pasaport",
]);

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
// +90 5xx xxx xx xx ve benzerleri: 10+ haneli, ayraçlı olabilir.
const PHONE_RE = /(?:\+?\d[\s()-]?){10,}/g;

function maskString(value: string): string {
  return value.replace(EMAIL_RE, "[eposta]").replace(PHONE_RE, "[telefon]");
}

/** Bir alan adı kişisel veri mi? */
function isPiiKey(key: string): boolean {
  return PII_KEYS.has(key.toLowerCase().replace(/[^a-z_]/g, ""));
}

export function redact(input: unknown, depth = 0): unknown {
  if (depth > 6) return "[derin]";
  if (input === null || input === undefined) return input;
  if (typeof input === "string") return maskString(input);
  if (typeof input === "number" || typeof input === "boolean") return input;
  if (Array.isArray(input)) return input.map((v) => redact(v, depth + 1));
  if (input instanceof Error) {
    return {
      name: input.name,
      message: maskString(input.message),
      stack: input.stack ? maskString(input.stack).split("\n").slice(0, 8) : undefined,
    };
  }
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = isPiiKey(k) ? "[gizlendi]" : redact(v, depth + 1);
    }
    return out;
  }
  return "[bilinmeyen]";
}

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): Level {
  const raw = process.env.LOG_LEVEL as Level | undefined;
  if (raw && raw in LEVEL_ORDER) return raw;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const RELEASE =
  process.env.NEXT_PUBLIC_RELEASE ??
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  "dev";

export type LogFields = Record<string, unknown> & {
  /** İsteği uçtan uca izlemek için; header'dan gelir ya da üretilir. */
  requestId?: string;
  /** Çok kiracılı sistemde hangi acente — kişisel veri değil, kimlik değil. */
  tenantId?: string;
  /** Ölçülen süre. */
  durationMs?: number;
};

function emit(level: Level, event: string, fields: LogFields = {}) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    release: RELEASE,
    env: process.env.NODE_ENV ?? "development",
    ...(redact(fields) as Record<string, unknown>),
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(record)
      : `${record.ts} ${level.toUpperCase().padEnd(5)} ${event} ${
          Object.keys(fields).length ? JSON.stringify(redact(fields)) : ""
        }`;

  // Uyarı ve hata stderr'e, gerisi stdout'a: toplayıcılar bunu ayırır.
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: LogFields) => emit("debug", event, fields),
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};

/** İstek kimliği: gelen header varsa korunur, yoksa üretilir. */
export function requestIdFrom(headers: Headers): string {
  return (
    headers.get("x-request-id") ??
    headers.get("x-vercel-id") ??
    crypto.randomUUID()
  );
}
