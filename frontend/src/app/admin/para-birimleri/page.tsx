import { CURRENCIES, FX_SOURCES } from "@/data/mock";
import { formatDate, t } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";

/** Para birimi ve kur kaynağı — Sitemap Bölüm 1 (MVP), Strateji Dok. 3.2. */
export default function ParaBirimleriPage() {
  const selected = FX_SOURCES.find((f) => f.selected)!;

  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.currencies.title")}</h1>

      <section className="mt-5 max-w-2xl rounded-[var(--radius-lg)] border border-line-strong bg-surface p-4">
        <h2 className="font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
          {t("admin.currencies.source")}
        </h2>
        <fieldset className="mt-3 flex flex-col gap-2">
          <legend className="sr-only">{t("admin.currencies.source")}</legend>
          {FX_SOURCES.map((f) => (
            <label key={f.id} className="flex items-center gap-3">
              <input
                type="radio"
                name="fx"
                defaultChecked={f.selected}
                className="h-4 w-4 accent-[var(--action-primary)]"
              />
              <span className="flex-1 text-[length:var(--font-ui)] text-ink">{f.name}</span>
              <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
                {formatDate(f.updatedAt)}
              </span>
            </label>
          ))}
        </fieldset>
        <p className="mt-3 border-t border-line pt-2 text-[length:var(--font-ui-sm)] text-ink-2">
          {t("admin.currencies.updated", { time: formatDate(selected.updatedAt) })}
        </p>
      </section>

      <section className="mt-8 max-w-3xl">
        <AdminTable
          columns={[
            { key: "code", label: t("admin.currencies.col.code"), width: "w-24" },
            { key: "name", label: t("admin.currencies.col.name") },
            { key: "rate", label: t("admin.currencies.col.rate"), align: "end", width: "w-40" },
          ]}
        >
          {CURRENCIES.map((c) => (
            <AdminRow key={c.code}>
              <Cell tone="strong" className="tnum">{c.code}</Cell>
              <Cell tone="muted">
                {c.name}
                {c.isBase && (
                  <span className="ms-2 rounded-[2px] border border-line-strong bg-sunken px-1.5 text-[length:var(--font-ui-xs)] text-ink-2">
                    {t("admin.currencies.base")}
                  </span>
                )}
              </Cell>
              <Cell align="end" className="tnum">
                {c.isBase ? "—" : c.rate.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </Cell>
            </AdminRow>
          ))}
        </AdminTable>
      </section>
    </>
  );
}
