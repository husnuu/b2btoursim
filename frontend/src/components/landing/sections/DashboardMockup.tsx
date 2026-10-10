import Image from "next/image";
import {
  BarChart3,
  CalendarDays,
  CalendarCheck2,
  Check,
  LayoutGrid,
  Package,
  Search,
  Ticket,
  Truck,
  Users,
} from "lucide-react";

/**
 * Hero'daki ürün arayüzü maketi. Gerçek HTML olarak çizildi — keskin kalır,
 * ekran boyutuna uyar ve ziyaretçiye platformun ne yaptığını gösterir.
 * Ürünler, tedarikçiler ve fiyatlar örnektir.
 */

const sidebar = [
  { icon: LayoutGrid, label: "Genel Bakış" },
  { icon: Package, label: "Ürünler", active: true },
  { icon: CalendarCheck2, label: "Rezervasyonlar", count: 12 },
  { icon: Truck, label: "Tedarikçiler" },
  { icon: Users, label: "Acenteler" },
  { icon: CalendarDays, label: "Müsaitlik" },
  { icon: BarChart3, label: "Satışlar" },
];

const products = [
  { title: "Çeşme Tekne Turu", supplier: "Ege Koyları Denizcilik", image: "/images/tekne.jpg", net: "1.250", commission: "15", stock: 18, tag: "Tekne" },
  { title: "Kapadokya Balon Turu", supplier: "Göreme Balon Org.", image: "/images/balon.jpg", net: "7.800", commission: "12", stock: 6, tag: "Aktivite" },
  { title: "İstanbul Havalimanı Transferi", supplier: "Boğaz VIP Transfer", image: "/images/transfer.jpg", net: "2.100", commission: "18", stock: 24, tag: "Transfer" },
  { title: "Çeşme–Sakız Feribot Bileti", supplier: "Ege Hatları", image: "/images/feribot.jpg", net: "1.640", commission: "10", stock: 40, tag: "Feribot" },
];

const chips = ["Tümü", "Tekne", "Aktivite", "Transfer", "Feribot"];

export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Uygulama penceresi */}
      <div
        className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[var(--shadow-photo)]"
        role="img"
        aria-label="Seyyah paneli örneği: tedarikçilerden gelen tekne turu, balon turu, transfer ve feribot ürünleri; net fiyat, komisyon ve kontenjan bilgileriyle listeleniyor."
      >
        <div className="flex h-9 items-center gap-1.5 border-b border-line bg-mist px-4" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="mx-auto hidden h-5 w-56 rounded-md bg-white text-center text-[10px] leading-5 text-ink-3 sm:block">
            Seyyah · Ürünler
          </span>
        </div>

        <div className="flex" aria-hidden="true">
          {/* Sol menü */}
          <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-line bg-white p-3 md:flex">
            <p className="px-2 pt-1 pb-2 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">Acente Paneli</p>
            {sidebar.map(({ icon: Icon, label, active, count }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] ${
                  active ? "bg-pop-soft font-semibold text-ink" : "text-ink-2"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
                {count && (
                  <span className="ml-auto rounded-full bg-ink px-1.5 text-[10px] font-semibold text-pop">{count}</span>
                )}
              </div>
            ))}
          </aside>

          {/* İçerik */}
          <div className="min-w-0 flex-1 bg-mist p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-line bg-white px-2.5 text-[11px] text-ink-3">
                <Search className="size-3.5" />
                Ürün, tedarikçi veya bölge ara
              </div>
              <div className="hidden h-8 items-center rounded-lg bg-ink px-3 text-[11px] font-medium text-white sm:flex">
                + Ürün ekle
              </div>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-hidden">
              {chips.map((c, i) => (
                <span
                  key={c}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${
                    i === 0 ? "bg-ink text-white" : "border border-line bg-white text-ink-2"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {products.map((p, i) => (
                <div key={p.title} className="overflow-hidden rounded-xl border border-line bg-white">
                  <div className="relative aspect-[16/9]">
                    <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover"
                      preload={i < 2} />
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-ink">
                      {p.tag}
                    </span>
                  </div>
                  <div className="p-2 sm:p-2.5">
                    <p className="truncate text-[11px] font-semibold text-ink sm:text-[12px]">{p.title}</p>
                    <p className="truncate text-[9px] text-ink-3 sm:text-[10px]">{p.supplier}</p>
                    <div className="mt-1.5 flex items-end justify-between gap-1">
                      <div>
                        <p className="text-[8px] text-ink-3 uppercase sm:text-[9px]">B2B net</p>
                        <p className="text-[11px] font-semibold text-ink tabular-nums sm:text-[13px]">₺{p.net}</p>
                      </div>
                      <div className="text-right">
                        <span className="hidden rounded bg-pop-soft px-1 py-0.5 text-[9px] font-semibold text-pop-deep sm:inline">
                          %{p.commission} kom.
                        </span>
                        <p className="mt-0.5 text-[9px] text-ink-3 tabular-nums">{p.stock} yer</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Yüzen rezervasyon kartı */}
      <div
        aria-hidden="true"
        className="float-late absolute -bottom-12 right-2 w-[210px] sm:-right-8 sm:w-[240px] rounded-2xl border border-ink/5 bg-white p-3.5 shadow-[var(--shadow-card)] sm:-left-8 sm:w-[250px] lg:-left-12"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-ink">Yeni rezervasyon</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-pop-soft px-2 py-0.5 text-[10px] font-semibold text-pop-deep">
            <Check className="size-3" /> Onaylandı
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-pop-soft text-ink">
            <Ticket className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-ink">Çeşme–Sakız Feribot</p>
            <p className="text-[10px] text-ink-3">14 Haz · 2 yetişkin · Gidiş-dönüş</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[10px]">
          <span className="text-ink-3">Voucher hazır</span>
          <span className="font-semibold text-ink underline">Görüntüle →</span>
        </div>
      </div>

    </div>
  );
}
