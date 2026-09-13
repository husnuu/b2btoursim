import { t } from "@/lib/i18n";
import { signOut } from "@/lib/auth/actions";

/**
 * Oturum var ama bu Auth hesabına bağlı aktif bir app_user yok: davet
 * dışı yoldan açılmış ya da devre dışı bırakılmış hesap. Boş ekran
 * yerine ne olduğunu ve çıkışı gösterir.
 */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl px-[var(--pad-x)] py-16">
      <p className="rounded-[var(--radius)] border border-warning bg-warning-tint px-4 py-3 text-ink">
        <span aria-hidden="true">△ </span>
        {t("auth.unlinked")}
      </p>
      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
        >
          {t("user.signOut")}
        </button>
      </form>
    </div>
  );
}
