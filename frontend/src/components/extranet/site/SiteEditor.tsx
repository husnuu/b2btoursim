"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import {
  MODULE_SECTIONS,
  SECTION_KINDS,
  SINGLETON_SECTIONS,
  makeSection,
  moveSection,
  type SectionKind,
  type SiteConfig,
  type SiteSection,
} from "@/lib/site/config";
import { publishSite, revertSiteDraft, saveSiteDraft } from "@/lib/site/actions";
import { BRAND_PALETTE } from "@/lib/theme";
import { Button } from "@/components/primitives/Button";

/**
 * Site tasarımı editörü.
 *
 * Sol sütun: bölüm listesi (sürükle-bırak + klavye okları), seçili bölümün
 * alanları, karakter/menü/altbilgi/SEO panelleri. Sağ sütun: taslağın
 * önizlemesi — `/site-onizleme` aynı origin'de, oturumdan kiracıyı alır.
 *
 * Her değişiklik 700 ms sonra taslağa yazılır (autosave); önizleme her
 * kayıtta yenilenir. "Yayınla" taslağı müşteriye açar.
 */
type ContentCount = Record<string, number>;

const input =
  "h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2 " +
  "text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action";
const textarea =
  "w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2 py-1.5 " +
  "text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action";

export function SiteEditor({
  initial,
  publishedAt,
  content,
  liveUrl,
}: {
  initial: SiteConfig;
  publishedAt: string | null;
  content: ContentCount;
  liveUrl: string;
}) {
  const [config, setConfig] = useState<SiteConfig>(initial);
  const [selected, setSelected] = useState<string>(initial.sections[0]?.id ?? "hero");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishState, setPublishState] = useState<{ at: string | null; busy: boolean; error?: string }>({
    at: publishedAt,
    busy: false,
  });
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragFrom = useRef<number | null>(null);

  const update = useCallback((patch: (c: SiteConfig) => SiteConfig) => {
    dirty.current = true;
    setConfig((c) => patch(c));
  }, []);

  // Autosave: son değişiklikten 700 ms sonra.
  useEffect(() => {
    if (!dirty.current) return;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveSiteDraft(config);
      if (res.ok) {
        setStatus("saved");
        setPreviewKey((k) => k + 1);
      } else {
        setStatus("error");
      }
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [config]);

  const sectionAt = (id: string) => config.sections.find((s) => s.id === id);
  const patchSection = (id: string, patch: Partial<SiteSection>) =>
    update((c) => ({ ...c, sections: c.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const move = (from: number, to: number) => {
    // Kahraman alanı hep 0'da kalır.
    if (from === 0 || to === 0 || to < 0 || to >= config.sections.length) return;
    update((c) => ({ ...c, sections: moveSection(c.sections, from, to) }));
  };

  const addSection = (kind: SectionKind) => {
    const s = makeSection(kind);
    update((c) => ({ ...c, sections: [...c.sections, s] }));
    setSelected(s.id);
  };

  const removeSection = (id: string) => {
    update((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== id) }));
    if (selected === id) setSelected("hero");
  };

  const publish = async () => {
    setPublishState((p) => ({ ...p, busy: true, error: undefined }));
    // Bekleyen autosave varsa önce onu yaz.
    if (timer.current) {
      clearTimeout(timer.current);
      await saveSiteDraft(config);
    }
    const res = await publishSite();
    setPublishState({ at: res.ok ? res.at : publishState.at, busy: false, error: res.ok ? undefined : res.error });
    if (res.ok) setStatus("saved");
  };

  const revert = async () => {
    const res = await revertSiteDraft();
    if (res.ok) window.location.reload();
  };

  const availableKinds = SECTION_KINDS.filter(
    (k) => !SINGLETON_SECTIONS.includes(k) || !config.sections.some((s) => s.kind === k),
  );
  const current = sectionAt(selected);

  const statusText: Record<typeof status, string> = {
    idle: "",
    saving: t("site.saving"),
    saved: t("site.saved"),
    error: t("site.saveError"),
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0">
      {/* --- Sol: düzenleme ------------------------------------------------ */}
      <div className="flex w-[26rem] shrink-0 flex-col overflow-y-auto border-e border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <h1 className="text-lg font-medium text-ink">{t("site.title")}</h1>
          <p className="mt-1 text-[length:var(--font-ui-xs)] text-ink-2">{t("site.lead")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={publish} disabled={publishState.busy}>
              {publishState.busy ? t("site.publishing") : t("site.publish")}
            </Button>
            {publishState.at && (
              <Button size="sm" onClick={revert}>
                {t("site.revert")}
              </Button>
            )}
            <span role="status" aria-live="polite" className="text-[length:var(--font-ui-xs)] text-ink-3">
              {statusText[status]}
            </span>
          </div>
          <p className="mt-2 text-[length:var(--font-ui-xs)] text-ink-2">
            {publishState.error ? `✕ ${publishState.error}` : publishState.at ? `✓ ${t("site.published")}` : `△ ${t("site.unpublished")}`}
            {liveUrl && (
              <>
                {" · "}
                <a href={liveUrl} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2">
                  {liveUrl.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </p>
        </div>

        {/* Bölümler */}
        <section className="border-b border-line px-4 py-3">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">{t("site.sections")}</h2>
          <p className="mt-0.5 text-[length:var(--font-ui-xs)] text-ink-3">{t("site.sectionsHint")}</p>
          <ul className="mt-2 flex flex-col gap-1" role="list">
            {config.sections.map((s, i) => {
              const empty = isEmpty(s, content);
              const isHero = s.kind === "hero";
              return (
                <li
                  key={s.id}
                  draggable={!isHero}
                  onDragStart={() => {
                    dragFrom.current = i;
                  }}
                  onDragOver={(e) => {
                    if (!isHero) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (dragFrom.current != null) move(dragFrom.current, i);
                    dragFrom.current = null;
                  }}
                  className={`flex items-center gap-2 rounded-[var(--radius)] border px-2 py-1.5 ${
                    selected === s.id ? "border-action bg-action-tint" : "border-line bg-surface"
                  } ${isHero ? "" : "cursor-grab"}`}
                >
                  <span aria-hidden="true" className="text-ink-3">{isHero ? "◇" : "⋮⋮"}</span>
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    disabled={isHero}
                    aria-label={`${labelOf(s)} ${s.enabled ? "açık" : "kapalı"}`}
                    onChange={(e) => patchSection(s.id, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setSelected(s.id)}
                    className="min-w-0 flex-1 truncate text-start text-[length:var(--font-ui-sm)] text-ink"
                  >
                    {labelOf(s)}
                    {empty && <span className="ms-2 text-[length:var(--font-ui-xs)] text-warning">{t("site.empty")}</span>}
                  </button>
                  {!isHero && (
                    <span className="flex gap-0.5">
                      <IconButton label={t("site.moveUp")} onClick={() => move(i, i - 1)} disabled={i <= 1}>↑</IconButton>
                      <IconButton label={t("site.moveDown")} onClick={() => move(i, i + 1)} disabled={i >= config.sections.length - 1}>↓</IconButton>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <label className="mt-2 flex items-center gap-2 text-[length:var(--font-ui-xs)] text-ink-2">
            {t("site.addSection")}
            <select
              className={`${input} h-7 w-auto`}
              value=""
              onChange={(e) => {
                if (e.target.value) addSection(e.target.value as SectionKind);
                e.target.value = "";
              }}
            >
              <option value="">…</option>
              {availableKinds.map((k) => (
                <option key={k} value={k}>
                  {t(`site.kind.${k}` as MessageKey)}
                </option>
              ))}
            </select>
          </label>
        </section>

        {/* Seçili bölüm */}
        {current && (
          <section className="border-b border-line px-4 py-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">{labelOf(current)}</h2>
              {current.kind !== "hero" && (
                <button type="button" onClick={() => removeSection(current.id)} className="text-[length:var(--font-ui-xs)] text-danger underline underline-offset-2">
                  {t("site.remove")}
                </button>
              )}
            </div>
            {isEmpty(current, content) && (
              <p className="mt-1 text-[length:var(--font-ui-xs)] text-warning">{emptyHint(current)}</p>
            )}
            <div className="mt-2 grid gap-2">
              <Field label={t("site.section.title")}>
                <input className={input} value={current.title} onChange={(e) => patchSection(current.id, { title: e.target.value })} />
              </Field>
              {current.kind === "hero" && (
                <Field label={t("site.section.heroEyebrow")}>
                  <input className={input} value={current.body} onChange={(e) => patchSection(current.id, { body: e.target.value })} />
                </Field>
              )}
              {current.kind !== "faq" && current.kind !== "reasons" && current.kind !== "custom" && (
                <Field label={t("site.section.lead")}>
                  <textarea className={textarea} rows={2} value={current.lead} onChange={(e) => patchSection(current.id, { lead: e.target.value })} />
                </Field>
              )}
              {MODULE_SECTIONS.includes(current.kind) && (
                <Field label={t("site.section.limit")}>
                  <input type="number" min={1} max={24} className={`${input} w-24`} value={current.limit} onChange={(e) => patchSection(current.id, { limit: Number(e.target.value) || 1 })} />
                </Field>
              )}
              {(current.kind === "faq" || current.kind === "reasons" || current.kind === "custom") && (
                <Field
                  label={
                    current.kind === "faq"
                      ? t("site.section.faqBody")
                      : current.kind === "reasons"
                        ? t("site.section.reasonsBody")
                        : t("site.section.body")
                  }
                >
                  <textarea className={textarea} rows={8} value={current.body} onChange={(e) => patchSection(current.id, { body: e.target.value })} />
                </Field>
              )}
            </div>
          </section>
        )}

        {/* Karakter */}
        <section className="border-b border-line px-4 py-3">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">{t("site.theme")}</h2>
          <div className="mt-2 grid gap-2">
            <Field label={t("site.brand")}>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_PALETTE.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    title={b.name}
                    aria-label={b.name}
                    aria-pressed={config.theme.brand === b.id}
                    onClick={() => update((c) => ({ ...c, theme: { ...c.theme, brand: b.id } }))}
                    className={`h-6 w-6 rounded-full border-2 ${config.theme.brand === b.id ? "border-ink" : "border-transparent"}`}
                    style={{ background: b.highlight ? `linear-gradient(135deg, ${b.hex} 50%, ${b.highlight} 50%)` : b.hex }}
                  />
                ))}
              </div>
            </Field>
            <Choice
              label={t("site.header")}
              value={config.theme.header}
              options={[["light", t("site.header.light")], ["inverse", t("site.header.inverse")]]}
              onChange={(v) => update((c) => ({ ...c, theme: { ...c.theme, header: v as "light" | "inverse" } }))}
            />
            <Choice
              label={t("site.radius")}
              value={config.theme.radius}
              options={[["soft", t("site.radius.soft")], ["sharp", t("site.radius.sharp")]]}
              onChange={(v) => update((c) => ({ ...c, theme: { ...c.theme, radius: v as "soft" | "sharp" } }))}
            />
            <Choice
              label={t("site.heroLayout")}
              value={config.theme.hero}
              options={[["split", t("site.hero.split")], ["centered", t("site.hero.centered")]]}
              onChange={(v) => update((c) => ({ ...c, theme: { ...c.theme, hero: v as "split" | "centered" } }))}
            />
            <Field label={t("site.trustBadges")}>
              <textarea
                className={textarea}
                rows={3}
                defaultValue={config.theme.trustBadges.join("\n")}
                onBlur={(e) =>
                  update((c) => ({
                    ...c,
                    theme: {
                      ...c.theme,
                      trustBadges: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4),
                    },
                  }))
                }
              />
            </Field>
          </div>
        </section>

        {/* Menü */}
        <section className="border-b border-line px-4 py-3">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">{t("site.nav")}</h2>
          <div className="mt-2 grid gap-2">
            <Field label={t("site.navLinks")}>
              <textarea
                className={textarea}
                rows={3}
                defaultValue={config.nav.links.map((l) => `${l.label} | ${l.href}`).join("\n")}
                onBlur={(e) =>
                  update((c) => ({
                    ...c,
                    nav: {
                      ...c.nav,
                      links: e.target.value
                        .split("\n")
                        .map((line) => line.split("|").map((x) => x.trim()))
                        .filter((p) => p.length === 2 && p[0] && p[1])
                        .map(([label, href]) => ({ label, href })),
                    },
                  }))
                }
              />
            </Field>
            <Field label={t("site.announcement")}>
              <input className={input} maxLength={160} value={config.nav.announcement} onChange={(e) => update((c) => ({ ...c, nav: { ...c.nav, announcement: e.target.value } }))} />
            </Field>
            <Toggle label={t("site.showCart")} checked={config.nav.showCart} onChange={(v) => update((c) => ({ ...c, nav: { ...c.nav, showCart: v } }))} />
            <Toggle label={t("site.showSignIn")} checked={config.nav.showSignIn} onChange={(v) => update((c) => ({ ...c, nav: { ...c.nav, showSignIn: v } }))} />
          </div>
        </section>

        {/* Sayfalar: iptal-iade ve KVKK metni (VITRIN.md §4.6) */}
        <section className="border-b border-line px-4 py-3">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">{t("site.pages")}</h2>
          <p className="mt-0.5 text-[length:var(--font-ui-xs)] text-ink-3">{t("site.pages.hint")}</p>
          <div className="mt-2 grid gap-2">
            <Field label={`${t("site.pages.iptalIade")}${config.pages.iptalIade.trim() ? "" : ` — ${t("site.empty")}`}`}>
              <textarea className={textarea} rows={6} maxLength={20000} value={config.pages.iptalIade} onChange={(e) => update((c) => ({ ...c, pages: { ...c.pages, iptalIade: e.target.value } }))} />
            </Field>
            <Field label={`${t("site.pages.kvkk")}${config.pages.kvkk.trim() ? "" : ` — ${t("site.empty")}`}`}>
              <textarea className={textarea} rows={6} maxLength={20000} value={config.pages.kvkk} onChange={(e) => update((c) => ({ ...c, pages: { ...c.pages, kvkk: e.target.value } }))} />
            </Field>
          </div>
        </section>

        {/* Altbilgi + SEO */}
        <section className="px-4 py-3">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">{t("site.footer")}</h2>
          <div className="mt-2 grid gap-2">
            <Field label={t("site.footerNote")}>
              <input className={input} value={config.footer.note} onChange={(e) => update((c) => ({ ...c, footer: { ...c.footer, note: e.target.value } }))} />
            </Field>
            <Field label={t("site.instagram")}>
              <input className={input} value={config.footer.instagram} onChange={(e) => update((c) => ({ ...c, footer: { ...c.footer, instagram: e.target.value } }))} />
            </Field>
            <Field label={t("site.whatsapp")}>
              <input className={input} value={config.footer.whatsapp} placeholder="+905..." onChange={(e) => update((c) => ({ ...c, footer: { ...c.footer, whatsapp: e.target.value } }))} />
            </Field>
            <Toggle label={t("site.showTursab")} checked={config.footer.showTursab} onChange={(v) => update((c) => ({ ...c, footer: { ...c.footer, showTursab: v } }))} />
          </div>
          <h2 className="mt-4 text-[length:var(--font-ui-sm)] font-medium text-ink">{t("site.seo")}</h2>
          <div className="mt-2 grid gap-2">
            <Field label={t("site.seoTitle")}>
              <input className={input} maxLength={80} value={config.seo.title} onChange={(e) => update((c) => ({ ...c, seo: { ...c.seo, title: e.target.value } }))} />
            </Field>
            <Field label={t("site.seoDescription")}>
              <textarea className={textarea} rows={2} maxLength={200} value={config.seo.description} onChange={(e) => update((c) => ({ ...c, seo: { ...c.seo, description: e.target.value } }))} />
            </Field>
          </div>
        </section>
      </div>

      {/* --- Sağ: önizleme ------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col bg-sunken">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("site.preview")}</span>
          <div className="ms-auto flex gap-1">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={`h-7 rounded-[var(--radius)] border px-2 text-[length:var(--font-ui-sm)] ${
                  device === d ? "border-line-strong bg-sunken text-ink" : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {t(`site.preview.${d}` as MessageKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4">
          <iframe
            key={previewKey}
            src={`/site-onizleme?v=${previewKey}`}
            title={t("site.preview")}
            className="h-full border border-line bg-surface shadow-sm"
            style={{ width: device === "mobile" ? 390 : "100%", maxWidth: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

/* --- Yardımcılar ------------------------------------------------------- */

function labelOf(s: SiteSection): string {
  return t(`site.kind.${s.kind}` as MessageKey);
}

function isEmpty(s: SiteSection, content: ContentCount): boolean {
  if (s.kind === "hero") return false;
  if (s.kind === "faq" || s.kind === "reasons" || s.kind === "custom") return s.body.trim().length === 0;
  return (content[s.kind] ?? 0) === 0;
}

function emptyHint(s: SiteSection): string {
  if (s.kind === "tours" || s.kind === "departures") return t("site.emptyHint.tours");
  if (s.kind === "about") return t("site.emptyHint.about");
  if (s.kind === "contact") return t("site.emptyHint.contact");
  if (s.kind === "faq") return t("site.emptyHint.faq");
  if (s.kind === "reasons") return t("site.emptyHint.reasons");
  if (s.kind === "custom") return t("site.emptyHint.custom");
  return t("site.emptyHint.module");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[length:var(--font-ui-xs)] text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[length:var(--font-ui-sm)] text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--action-primary)]" />
      {label}
    </label>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[length:var(--font-ui-xs)] text-ink-2">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-1">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`h-7 rounded-[var(--radius)] border px-2 text-[length:var(--font-ui-sm)] ${
              value === v ? "border-action bg-action-tint text-ink" : "border-line text-ink-2 hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="h-6 w-6 rounded-[2px] text-[length:var(--font-ui-sm)] text-ink-3 hover:bg-sunken hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
