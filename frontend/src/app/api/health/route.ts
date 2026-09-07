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
 * DİKKAT: şu an gerçek bağımlılık yok — veriler mock. `dependencies` bunu
 * olduğu gibi bildirir; "healthy" görüntüsü vermez.
 */

export const dynamic = "force-dynamic";

const STARTED_AT = Date.now();

type Check = {
  name: string;
  status: "up" | "down" | "degraded" | "not_configured";
  latencyMs?: number;
  detail?: string;
};

async function checkDependencies(): Promise<Check[]> {
  // Backend bağlandığında her bağımlılık buraya kendi zaman aşımıyla girer.
  // Bir tedarikçinin yavaşlığı readiness'ı düşürmemeli: degraded döner.
  return [
    {
      name: "api",
      status: "not_configured",
      detail: "Backend henüz bağlı değil; veriler src/data/mock.ts içinden",
    },
    {
      name: "supplier-adapters",
      status: "not_configured",
      detail: "Tedarikçi adaptörleri simüle ediliyor (use-supplier-search)",
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
      // Dürüst sinyal: prototip gerçek trafiğe hazır değil.
      body.status = "not_ready";
      body.reason = "Gerçek bağımlılık tanımlı değil, uygulama mock veriyle çalışıyor";
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
