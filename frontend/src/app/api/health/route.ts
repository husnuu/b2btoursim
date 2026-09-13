import { log, requestIdFrom } from "@/lib/log";

/**
 * Sağlık ucu.
 *
 * İki soruyu ayırır:
 *  - liveness: süreç ayakta mı? (`/api/health`)
 *  - readiness: trafik alabilir mi, bağımlılıkları çalışıyor mu?
 *    (`/api/health?ready=1`)
 *
 * Yük dengeleyici liveness'a bakıp süreci öldürür; deploy readiness'a bakıp
 * trafiği açar. İkisini tek uca bağlamak, yavaş bir tedarikçi yüzünden sağlıklı
 * sürecin öldürülmesine yol açar.
 *
 * Bağımlılıklar: Supabase (kimlik + veritabanı) gerçek ve ölçülür;
 * tedarikçi adaptörleri hâlâ simülasyon — readiness bunu saklamaz.
 */

export const dynamic = "force-dynamic";

const STARTED_AT = Date.now();
const DEPENDENCY_TIMEOUT_MS = 2_000;

type Check = {
  name: string;
  status: "up" | "down" | "degraded" | "not_configured";
  latencyMs?: number;
  detail?: string;
};

async function checkSupabase(): Promise<Check> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return { name: "supabase", status: "not_configured", detail: "NEXT_PUBLIC_SUPABASE_URL tanımlı değil" };
  }
  const t0 = performance.now();
  try {
    // Auth servisinin sağlık ucu: kimlik doğrulaması istemez, DB'ye dokunmaz.
    // "Auth ayakta" demek "giriş yapılabilir" demektir; bizim için yeterli sinyal.
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(DEPENDENCY_TIMEOUT_MS),
      cache: "no-store",
    });
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) return { name: "supabase", status: "down", latencyMs, detail: `HTTP ${res.status}` };
    return { name: "supabase", status: latencyMs > 1_000 ? "degraded" : "up", latencyMs };
  } catch (err) {
    return {
      name: "supabase",
      status: "down",
      latencyMs: Math.round(performance.now() - t0),
      detail: err instanceof Error ? err.name : "fetch failed",
    };
  }
}

async function checkDependencies(): Promise<Check[]> {
  // Her bağımlılık kendi zaman aşımıyla; bir tedarikçinin yavaşlığı
  // readiness'ı düşürmemeli: degraded döner.
  return [
    await checkSupabase(),
    {
      name: "supplier-adapters",
      status: "not_configured",
      detail: "Tedarikçi adaptörleri simüle ediliyor (use-supplier-search); iş verisi src/data/mock.ts",
    },
  ];
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  const wantsReadiness = new URL(request.url).searchParams.has("ready");
  const startedAt = performance.now();

  const body: Record<string, unknown> = {
    status: "ok",
    mode: wantsReadiness ? "readiness" : "liveness",
    release: process.env.NEXT_PUBLIC_RELEASE ?? "dev",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    env: process.env.NODE_ENV ?? "development",
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
    time: new Date().toISOString(),
  };

  let httpStatus = 200;

  if (wantsReadiness) {
    const checks = await checkDependencies();
    body.dependencies = checks;
    const down = checks.filter((c) => c.status === "down");
    const unconfigured = checks.filter((c) => c.status === "not_configured");

    if (down.length) {
      body.status = "down";
      httpStatus = 503;
    } else if (unconfigured.length) {
      // Dürüst sinyal: kimlik gerçek, iş verisi hâlâ mock.
      body.status = "not_ready";
      body.reason = "Tedarikçi adaptörleri bağlı değil; iş verisi mock";
      httpStatus = 503;
    }
  }

  body.checkDurationMs = Math.round(performance.now() - startedAt);

  log.info("health.check", {
    requestId,
    mode: body.mode,
    status: body.status,
    durationMs: body.checkDurationMs as number,
  });

  return Response.json(body, {
    status: httpStatus,
    headers: {
      "cache-control": "no-store",
      "x-request-id": requestId,
    },
  });
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
}
