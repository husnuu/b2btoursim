import Image from "next/image";
import type { ReactNode } from "react";
import { features } from "@/content/site";
import { Container, Heading, StatusTag, delay } from "@/components/landing/ui/primitives";
import { SailBullet } from "@/components/landing/ui/Glyphs";

/* Küçük, gerçekçi arayüz parçaları. Veriler örnektir. */

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-[var(--shadow-photo)] sm:p-5 ${className}`} aria-hidden="true">
      <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-3 uppercase">{title}</p>
      {children}
    </div>
  );
}

function ReservationsUI() {
  const rows = [
    { product: "Çeşme Tekne Turu", agency: "Mavi Rota Turizm", status: "Onaylandı", ok: true },
    { product: "Kapadokya Balon Turu", agency: "Anadolu Gezi", status: "Beklemede", ok: false },
    { product: "İST Havalimanı Transferi", agency: "Kuzey Seyahat", status: "Onaylandı", ok: true },
    { product: "Çeşme–Sakız Feribot", agency: "Mavi Rota Turizm", status: "Voucher", ok: true },
  ];
  return (
    <Card title="Bugünkü rezervasyonlar">
      <ul className="divide-y divide-line text-[12.5px]">
        {rows.map((r) => (
          <li key={r.product} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.product}</span>
              <span className="block truncate text-ink-3">{r.agency}</span>
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${r.ok ? "bg-pop text-ink" : "bg-amber-soft text-amber"}`}>{r.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AvailabilityUI() {
  const days = [2, 2, 1, 2, 0, 1, 2, 2, 2, 1, 0, 0, 2, 2];
  const color = ["bg-mist text-ink/30 line-through", "bg-amber-soft text-amber", "bg-pop-soft text-pop-deep"];
  return (
    <Card title="Haziran · Kontenjan">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold">
        {days.map((d, i) => (
          <span key={i} className={`rounded-md py-1.5 tabular-nums ${color[d]}`}>{i + 8}</span>
        ))}
      </div>
    </Card>
  );
}

function PricingUI() {
  const rows = [
    { label: "Tedarikçi net fiyatı", value: "₺1.250", strong: true },
    { label: "Mavi Rota Turizm", value: "%15 komisyon" },
    { label: "Anadolu Gezi", value: "₺1.180 özel net" },
    { label: "Alt acenteler", value: "%10 komisyon", muted: true },
  ];
  return (
    <Card title="Çeşme Tekne Turu · Fiyat kuralları">
      {rows.map((r) => (
        <div key={r.label} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] ${r.strong ? "bg-ink text-white" : ""}`}>
          <span className={r.muted ? "text-ink-3" : ""}>{r.label}</span>
          <span className={`font-bold tabular-nums ${r.strong ? "text-pop" : r.muted ? "text-ink-3" : ""}`}>{r.value}</span>
        </div>
      ))}
    </Card>
  );
}

function PartnersUI() {
  const partners = [
    { name: "Mavi Rota Turizm", role: "Acente", initials: "MR", on: true },
    { name: "Ege Koyları Denizcilik", role: "Tedarikçi", initials: "EK", on: true },
    { name: "Kuzey Seyahat", role: "Acente", initials: "KS", on: false },
  ];
  return (
    <Card title="İş ortakları">
      <ul className="flex flex-col gap-2">
        {partners.map((p) => (
          <li key={p.name} className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-ink text-[11px] font-bold text-pop">{p.initials}</span>
            <span className="min-w-0 flex-1 text-[13px]">
              <span className="block truncate font-semibold">{p.name}</span>
              <span className="block text-[11px] text-ink-3">{p.role}</span>
            </span>
            <span className={`relative h-5 w-9 rounded-full ${p.on ? "bg-pop-deep" : "bg-ink/15"}`}>
              <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow ${p.on ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ReportsUI() {
  const bars = [38, 52, 46, 64, 58, 76, 70, 88];
  return (
    <Card title="Aylık satış · örnek">
      <div className="flex h-28 items-end gap-1.5">
        {bars.map((h, i) => (
          <span key={i} className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-ink" : "bg-pop"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-line pt-3 text-[12px]">
        <span className="text-ink-3">Bekleyen hakediş</span>
        <span className="font-bold tabular-nums">₺48.320</span>
      </div>
    </Card>
  );
}

function IntegrationUI() {
  return (
    <pre aria-hidden="true" className="overflow-hidden rounded-2xl bg-ink p-5 font-mono text-[11.5px] leading-relaxed text-white/70 shadow-[var(--shadow-photo)]">
      <span className="text-pop">GET</span> /v1/products?category=boat{"\n"}
      {"{"}{"\n"}
      {"  "}<span className="text-pop">&quot;product&quot;</span>: &quot;Çeşme Tekne Turu&quot;,{"\n"}
      {"  "}<span className="text-pop">&quot;availability&quot;</span>: 18,{"\n"}
      {"  "}<span className="text-pop">&quot;net_price&quot;</span>: 1250{"\n"}
      {"}"}
    </pre>
  );
}

type Row = {
  title: string;
  lead: string;
  keys: string[];
  photo: { src: string; alt: string };
  front: ReactNode;
  back: ReactNode;
};

const rows: Row[] = [
  {
    title: "Rezervasyonlar tek ekranda.\nTelefon trafiği değil.",
    lead: "Rezervasyonu, onayı ve müsaitliği tek bir merkezden yönetin; kim, neyi, ne zaman sattı her an görünsün.",
    keys: ["rezervasyon", "kontenjan"],
    photo: { src: "/images/tekne.jpg", alt: "Koyda demirli gulet" },
    front: <ReservationsUI />,
    back: <AvailabilityUI />,
  },
  {
    title: "Fiyatı da ortağı da\nsiz belirleyin.",
    lead: "Her iş ortağına kendi ticari koşulunu tanımlayın: net fiyat, özel indirim ya da komisyon.",
    keys: ["fiyat", "partner"],
    photo: { src: "/images/kultur.jpg", alt: "Gün batımında Ayasofya" },
    front: <PricingUI />,
    back: <PartnersUI />,
  },
  {
    title: "Büyüdükçe genişleyen\nbir altyapı.",
    lead: "Raporlama ve entegrasyon modülleri yol haritamızda. Hazır olduklarında aynı panele eklenecekler.",
    keys: ["rapor", "entegrasyon"],
    photo: { src: "/images/feribot.jpg", alt: "Denizde ilerleyen feribot" },
    front: <ReportsUI />,
    back: <IntegrationUI />,
  },
];

function Collage({ row, flip }: { row: Row; flip: boolean }) {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[560px] sm:aspect-[6/5]">
      <div
        data-parallax="0.04"
        className={`grain absolute top-[12%] bottom-[6%] rounded-[24px] bg-pop ${flip ? "right-[14%] left-0" : "right-0 left-[14%]"}`}
      />
      <div data-parallax="0.1" className={`absolute top-0 w-[54%] ${flip ? "right-0" : "left-0"}`}>
        <div className={`polaroid ${flip ? "rotate-[5deg]" : "-rotate-[5deg]"}`}>
          <div className="relative aspect-[4/5]">
            <Image src={row.photo.src} alt={row.photo.alt} fill sizes="(min-width: 1024px) 300px, 55vw" className="object-cover" />
          </div>
        </div>
      </div>
      <div data-parallax="-0.05" className={`absolute top-[10%] w-[60%] sm:w-[50%] ${flip ? "left-[4%]" : "right-[4%]"}`}>
        <div className={flip ? "-rotate-[3deg]" : "rotate-[3deg]"}>{row.back}</div>
      </div>
      <div data-parallax="-0.12" className={`absolute bottom-0 w-[84%] sm:w-[64%] ${flip ? "left-[4%] sm:left-[10%]" : "right-[4%] sm:right-[8%]"}`}>
        <div className={flip ? "rotate-[2deg]" : "-rotate-[2deg]"}>{row.front}</div>
      </div>
    </div>
  );
}

export function Features() {
  const byKey = Object.fromEntries(features.map((f) => [f.key, f]));
  return (
    <section id="ozellikler" aria-labelledby="ozellikler-baslik" className="overflow-hidden py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Heading id="ozellikler-baslik" size="xl">{"Acentenizin İhtiyaç\nDuyduğu Teknoloji."}</Heading>
          <p data-reveal style={delay(150)} className="mt-4 text-sm text-ink-3">Panel görselleri örnek verilerle hazırlanmıştır.</p>
        </div>

        <div className="mt-20 flex flex-col gap-28 sm:mt-28 sm:gap-36">
          {rows.map((row, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={row.title} className="grid items-center gap-24 lg:grid-cols-2 lg:gap-20">
                <div className={flip ? "lg:order-2" : ""}>
                  <Heading size="md" as="h3">{row.title}</Heading>
                  <p data-reveal style={delay(120)} className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">{row.lead}</p>
                  <ul className="mt-9 flex flex-col gap-6">
                    {row.keys.map((k, j) => {
                      const f = byKey[k];
                      return (
                        <li key={k} data-reveal style={delay(200 + j * 100)} className="flex gap-4">
                          <SailBullet className={`mt-1 size-5 shrink-0 ${f.status === "live" ? "text-ink" : "text-ink/30"}`} />
                          <div>
                            <h4 className="flex flex-wrap items-center gap-2.5 text-lg font-bold">
                              {f.title} <StatusTag status={f.status} />
                            </h4>
                            <p className="mt-1 leading-relaxed text-ink-2">{f.body}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div data-reveal style={delay(100)} className={flip ? "lg:order-1" : ""}>
                  <Collage row={row} flip={flip} />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
