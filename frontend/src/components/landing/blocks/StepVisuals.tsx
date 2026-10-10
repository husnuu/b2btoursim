import Image from "next/image";
import { Check, Search } from "lucide-react";

/* Adım kartlarının sağındaki küçük, temsili arayüz parçaları. */

const shell = "rounded-2xl bg-white p-4 text-ink shadow-[var(--shadow-photo)]";

export function VisualSearch() {
  return (
    <div className={`${shell} rotate-[2deg]`} aria-hidden="true">
      <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-ink-3">
        <Search className="size-4" /> Çeşme · Tekne · 14 Haziran
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["/images/tekne.jpg", "/images/yat.jpg", "/images/feribot.jpg"].map((src) => (
          <div key={src} className="relative aspect-square overflow-hidden rounded-lg">
            <Image src={src} alt="" fill sizes="100px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualPrice() {
  return (
    <div className={`${shell} -rotate-[2deg]`} aria-hidden="true">
      <p className="text-xs font-bold text-ink-3 uppercase">Size özel koşul</p>
      <p className="font-display mt-2 text-4xl">₺1.250 <span className="text-base font-sans font-semibold text-ink-3">net / kişi</span></p>
      <p className="mt-2 inline-block rounded-full bg-pop px-3 py-1 text-sm font-bold">%15 komisyon</p>
    </div>
  );
}

export function VisualBooking() {
  return (
    <div className={`${shell} rotate-[1.5deg]`} aria-hidden="true">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-mist p-3"><span className="block text-xs text-ink-3">Tarih</span><b>14 Haz</b></div>
        <div className="rounded-lg bg-mist p-3"><span className="block text-xs text-ink-3">Kişi</span><b>4 yetişkin</b></div>
      </div>
      <div className="mt-3 rounded-lg bg-ink py-3 text-center text-sm font-bold text-white">Rezervasyon talebi gönder</div>
    </div>
  );
}

export function VisualStatus({ items = ["Talep iletildi", "Tedarikçi onayladı", "Müşteriye bildirildi"] }: { items?: string[] }) {
  return (
    <ul className={`${shell} -rotate-[1.5deg] flex flex-col gap-2.5`} aria-hidden="true">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-3 text-sm font-semibold">
          <span className={`grid size-6 place-items-center rounded-full ${i < items.length - 1 ? "bg-pop" : "border-2 border-dashed border-ink/30"}`}>
            {i < items.length - 1 && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className={i < items.length - 1 ? "" : "text-ink-3"}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function VisualCalendar() {
  const d = [2, 2, 1, 0, 2, 2, 1, 2, 2, 0, 2, 1, 2, 2];
  const c = ["bg-mist text-ink/30 line-through", "bg-amber-soft text-amber", "bg-pop-soft text-pop-deep"];
  return (
    <div className={`${shell} rotate-[2deg]`} aria-hidden="true">
      <p className="mb-2 text-xs font-bold text-ink-3 uppercase">Kontenjan · Haziran</p>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold">
        {d.map((x, i) => (
          <span key={i} className={`rounded-md py-1.5 ${c[x]}`}>{i + 8}</span>
        ))}
      </div>
    </div>
  );
}

export function VisualPartners() {
  return (
    <div className={`${shell} -rotate-[2deg]`} aria-hidden="true">
      {["Mavi Rota Turizm", "Anadolu Gezi", "Kuzey Seyahat"].map((n, i) => (
        <div key={n} className="flex items-center justify-between py-1.5 text-sm font-semibold">
          {n}
          <span className={`relative h-5 w-9 rounded-full ${i < 2 ? "bg-pop-deep" : "bg-ink/15"}`}>
            <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow ${i < 2 ? "left-[18px]" : "left-0.5"}`} />
          </span>
        </div>
      ))}
    </div>
  );
}
