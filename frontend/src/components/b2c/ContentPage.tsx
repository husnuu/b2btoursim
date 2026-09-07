import type { ReactNode } from "react";

/**
 * Statik içerik sayfaları — Sitemap Bölüm 3, İçerik Sayfaları (MVP).
 *
 * CMS bağlanana kadar metinler burada. Satır uzunluğu 70 karakterin
 * altında tutuluyor; bunlar okunmak için var, taranmak için değil.
 */
export function ContentPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="font-dense text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.015em] text-ink">
        {title}
      </h1>
      {lead && (
        <p className="mt-4 text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">
          {lead}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-6 leading-relaxed text-ink-2 [&_h2]:font-dense [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-ink [&_p]:max-w-[68ch]">
        {children}
      </div>
    </article>
  );
}
