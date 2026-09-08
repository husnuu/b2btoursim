import Link from "next/link";

/**
 * Bölüm 3 — Kritik Mimari Ayrım. Gözlemlenen ekranlarda "Başvuru
 * Formları"/"Vize Başvuruları" sayfalarının en üstünde sabit bulunan
 * uyarı; doküman metniyle birebir.
 */
export function ApplicationProcessBanner() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line-strong bg-sunken px-[var(--pad-x)] py-2.5">
      <p className="text-[length:var(--font-ui-sm)] text-ink-2">
        Bu ekran vize satışı değil, vize başvuru süreci içindir. Buradaki formlar ve dosyalar yalnız
        başvuru sahibinden bilgi ve belge toplamaya, dosyayı konsolosluk sürecinde takip etmeye
        yarar; sitede satılan bir ürün ya da rezervasyon oluşturmaz.
      </p>
      <Link
        href="/extranet/vize"
        className="shrink-0 whitespace-nowrap text-[length:var(--font-ui-sm)] text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        Vizeler ekranına git
      </Link>
    </div>
  );
}
