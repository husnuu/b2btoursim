import { listCurrencies } from "@/lib/admin/load";
import { formatDate, t } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";
import { FxSourcePicker } from "@/components/admin/FxSourcePicker";

/** Para birimi ve kur kaynağı — Sitemap Bölüm 1 (MVP), Strateji Dok. 3.2. */
export default async function ParaBirimleriPage() {
  const { currencies: CURRENCIES, sources } = await listCurrencies();
  const selected = sources.find((f) => f.isSelected) ?? null;

  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.currencies.title")}</h1>

      <section className="mt-5 max-w-2xl rounded-[var(--radius-lg)] border border-line-strong bg-surface p-4">
        <h2 className="font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
          {t("admin.currencies.source")}
        </h2>
        <FxSourcePicker sources={sources} />
        <p className="mt-3 border-t border-line pt-2 text-[length:var(--font-ui-sm)] text-ink-2">
          {selected?.updatedAt ? t("admin.currencies.updated", { time: formatDate(selected.updatedAt) }) : "Henüz kur çekilmedi."}
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
                {c.isBase ? "—" : c.rate == null ? "—" : c.rate.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </Cell>
            </AdminRow>
          ))}
        </AdminTable>
      </section>
    </>
  );
}
