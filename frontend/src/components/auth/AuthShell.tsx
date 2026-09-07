import Link from "next/link";
import { t } from "@/lib/i18n";
import { AGENCY } from "@/data/mock";

/**
 * Giriş ve şifre sıfırlama için ortak kabuk.
 *
 * Kabuk yok: ray, bakiye ve sepet bu ekranlarda anlamsız. Sol tarafta
 * tenant kimliği, sağda form — beyaz etiketli kurulumda logo yuvası solda.
 */
export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="hidden flex-col justify-between bg-inverse p-10 lg:flex">
        <Link
          href="/"
          className="font-dense text-xl font-semibold tracking-tight text-ink-inverse"
        >
          {AGENCY.name}
        </Link>
        <div>
          <p className="max-w-[22ch] font-dense text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.015em] text-ink-inverse">
            {t("app.tagline")}
          </p>
          <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-inverse-2">
            {t("site.hero.lead")}
          </p>
        </div>
        <p className="text-[length:var(--font-ui-sm)] text-ink-inverse-2">
          {t("site.footer.rights")}
        </p>
      </div>

      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="font-dense text-lg font-semibold tracking-tight text-ink lg:hidden"
          >
            {AGENCY.name}
          </Link>
          <h1 className="mt-6 font-dense text-2xl font-semibold tracking-tight text-ink lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-ink-2">{lead}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  name,
  autoComplete,
  required,
  defaultValue,
}: {
  label: string;
  type?: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="h-11 rounded-[var(--radius)] border border-line-strong bg-surface px-3
                   text-[length:var(--font-ui)] text-ink outline-none
                   placeholder:text-ink-3 focus:border-action"
      />
    </label>
  );
}
