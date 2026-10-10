import type { ReactNode } from "react";

/**
 * Statik içerik sayfaları (hakkımızda, iletişim, SSS, iptal-iade, KVKK) —
 * Seyyah vitrin tipografisi: kalın başlık, geniş satır aralığı, 70
 * karakter altı satır. Bunlar okunmak için var, taranmak için değil.
 */
export function ContentPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:pt-14">
      <h1 className="text-[2rem] leading-[1.12] font-extrabold tracking-tight text-ink sm:text-[2.7rem]">{title}</h1>
      {lead && <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-2">{lead}</p>}
      <div className="mt-10 flex flex-col gap-6 text-[17px] leading-[1.75] text-ink-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:max-w-[68ch]">
        {children}
      </div>
    </article>
  );
}
