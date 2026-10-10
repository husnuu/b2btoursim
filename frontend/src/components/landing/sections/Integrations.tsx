import Link from "next/link";
import { ArrowRight, CalendarCog, Compass, CreditCard, Globe2, MonitorSmartphone, Ship, SquareStack } from "lucide-react";
import { integrations } from "@/content/site";
import { Container, Heading, StatusTag, delay } from "@/components/landing/ui/primitives";
import { SailBullet } from "@/components/landing/ui/Glyphs";
import { LogoMark } from "@/components/landing/ui/Logo";
import { ApplyButton } from "@/components/landing/application/ApplyButton";

const tiles = [
  { Icon: Compass, rot: "-rotate-6", pos: "top-[4%] left-[8%]" },
  { Icon: Ship, rot: "rotate-3", pos: "top-[0%] right-[6%]" },
  { Icon: CreditCard, rot: "rotate-6", pos: "top-[40%] right-[0%]" },
  { Icon: MonitorSmartphone, rot: "-rotate-3", pos: "bottom-[2%] right-[14%]" },
  { Icon: Globe2, rot: "rotate-2", pos: "bottom-[6%] left-[4%]" },
  { Icon: CalendarCog, rot: "-rotate-6", pos: "top-[44%] left-[-2%]" },
];

/** Sizin sisteminiz → Seyyah → satış kanalları. Bağlantılar planlanan durumda. */
function Flow() {
  return (
    <div className="relative grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 sm:gap-3" aria-hidden="true">
      <div className="flex flex-col items-center gap-3">
        <div className="grid size-20 place-items-center rounded-[22px] bg-mist sm:size-24">
          <SquareStack className="size-9 text-ink-3" />
        </div>
        <span className="text-center text-[13px] font-bold sm:text-sm">Sizin sisteminiz</span>
      </div>

      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="mb-8 h-4 w-full text-ink">
        <path d="M2 5 H92" stroke="currentColor" strokeWidth="2.5" className="dash-flow" vectorEffect="non-scaling-stroke" />
        <path d="M90 1 L98 5 L90 9" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="flex flex-col items-center gap-3">
        <div className="relative grid size-24 place-items-center rounded-[26px] bg-ink sm:size-28">
          <span className="pulse absolute inset-0 rounded-[26px] ring-4 ring-pop/40" />
          <LogoMark className="size-12 sm:size-14" tone="pop" />
        </div>
        <span className="text-center text-[13px] font-bold sm:text-sm">Seyyah</span>
      </div>

      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="mb-8 h-4 w-full text-ink">
        <path d="M2 5 H92" stroke="currentColor" strokeWidth="2.5" className="dash-flow" vectorEffect="non-scaling-stroke" />
        <path d="M90 1 L98 5 L90 9" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="flex flex-col items-center gap-3">
        <div className="relative size-28 sm:size-40">
          <div className="absolute inset-[18%] rounded-[22px] bg-pop" />
          {tiles.map(({ Icon, rot, pos }, i) => (
            <span
              key={i}
              className={`float absolute grid size-9 place-items-center rounded-xl bg-white shadow-[var(--shadow-card)] sm:size-12 ${rot} ${pos}`}
              style={{ animationDelay: `${i * 0.6}s` }}
            >
              <Icon className="size-4 sm:size-5" />
            </span>
          ))}
        </div>
        <span className="text-center text-[13px] font-bold sm:text-sm">Satış kanalları</span>
      </div>
    </div>
  );
}

export function Integrations() {
  return (
    <section id="entegrasyonlar" aria-labelledby="entegrasyon-baslik" className="py-24 sm:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Heading id="entegrasyon-baslik">{"Mevcut Sistemlerinizi\nBirbirine Bağlayın."}</Heading>
          <p data-reveal style={delay(150)} className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
            API ve XML tabanlı bağlantılarla turizm ürünlerinin farklı sistemler arasında dağıtımını kolaylaştırmayı
            hedefliyoruz.
          </p>
          <ul data-reveal style={delay(250)} className="mt-9 grid gap-x-8 sm:grid-cols-2">
            {integrations.map((it) => (
              <li key={it.title} className="flex items-center gap-3 border-b border-ink/10 py-3 text-[16px]">
                <SailBullet className="size-4.5 shrink-0 text-ink/40" />
                <span>{it.title}</span>
                <span className="ml-auto"><StatusTag status={it.status} /></span>
              </li>
            ))}
          </ul>
          <div data-reveal style={delay(300)} className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <ApplyButton variant="dark">Entegrasyon ihtiyacımı ilet</ApplyButton>
            <Link href="/entegrasyonlar" className="btn-arrow inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
              Yol haritasını görün <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <div data-reveal style={delay(100)} className="rounded-[28px] border-2 border-ink/10 px-4 py-14 sm:px-10">
          <Flow />
        </div>
      </Container>
    </section>
  );
}
