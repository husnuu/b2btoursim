"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { confirmEmailLink } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

/**
 * Üç bağlantı biçimini tek yerde çözer:
 *  1. `#access_token=…&refresh_token=…` — varsayılan e-posta şablonu
 *     (implicit akış). Yalnız tarayıcı görür; oturum burada çerezlere yazılır.
 *  2. `?token_hash=…&type=…` — sunucu tarafı şablon.
 *  3. `?code=…` — PKCE.
 * Hepsi sonunda `next`e gider; hata `/giris?error=link`e.
 */
export function ConfirmClient({
  tokenHash,
  type,
  code,
  next,
}: {
  tokenHash: string | null;
  type: string | null;
  code: string | null;
  next: string;
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const fail = () => router.replace("/giris?error=link");

    (async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = createClient();
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) return fail();
        // Token'lar adres çubuğunda ve geçmişte kalmasın.
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(next);
        return;
      }

      if (tokenHash || code) {
        const { ok } = await confirmEmailLink({ tokenHash, type, code });
        if (!ok) return fail();
        router.replace(next);
        return;
      }

      fail();
    })();
  }, [tokenHash, type, code, next, router]);

  return (
    <main className="grid min-h-dvh place-items-center bg-paper">
      <p role="status" aria-live="polite" className="text-ink-2">
        {t("auth.confirming")}
      </p>
    </main>
  );
}
