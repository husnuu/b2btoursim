"use client";

import { useEffect } from "react";
import { report } from "@/lib/report";

/**
 * Kök hata sınırı: layout'un kendisi çökerse burası devreye girer.
 * Kendi <html> ve <body> etiketlerini basmak zorunda — üstünde hiçbir şey
 * kalmamıştır, bu yüzden tasarım sistemine ya da i18n'e güvenmez.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    report({ kind: "client-error", message: error.message, stack: error.stack });
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          padding: "4rem 1.5rem",
          background: "#f0f2ef",
          color: "#16242b",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.5,
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 500, margin: 0 }}>
            Uygulama açılamadı
          </h1>
          <p style={{ color: "#4b5c63", marginTop: ".5rem" }}>
            Sayfayı yenileyin. Sorun sürerse destek hattına aşağıdaki numarayla
            başvurun.
          </p>
          {error.digest && (
            <p style={{ color: "#5b686d", fontSize: ".875rem" }}>
              Kayıt no: {error.digest}
            </p>
          )}
          <button
            onClick={() => retry()}
            style={{
              marginTop: "1.25rem",
              minHeight: 44,
              padding: "0 1.25rem",
              border: "1px solid #7b877c",
              borderRadius: 4,
              background: "#fff",
              color: "#16242b",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </main>
      </body>
    </html>
  );
}
