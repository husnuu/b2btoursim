import type { CSSProperties } from "react";
import { Anchor, Bus, Code2, Compass, Globe, Handshake, LayoutTemplate, Network, Store, Users } from "lucide-react";
import { distribution, type FeatureStatus } from "@/content/site";
import { Container, Heading, StatusTag, delay } from "@/components/landing/ui/primitives";
import { SailBullet } from "@/components/landing/ui/Glyphs";
import { LogoMark } from "@/components/landing/ui/Logo";

const sourceIcons = [Compass, Anchor, Bus, Users, Code2];
const channelIcons = [Store, Network, Globe, Handshake, LayoutTemplate];

type Node = { label: string; status: FeatureStatus };

/** Yörüngedeki tek düğüm. Halka dönerken içerik ters dönerek dik kalır. */
function Satellite({ node, Icon, angle, counter, tone }: { node: Node; Icon: typeof Store; angle: number; counter: string; tone: "pop" | "ink" }) {
  const planned = node.status !== "live";
  return (
    <div className="absolute inset-0" style={{ rotate: `${angle}deg` } as CSSProperties}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div style={{ rotate: `${-angle}deg` } as CSSProperties}>
          <div className={counter}>
            <div
              title={node.label}
              className={`grid size-12 place-items-center rounded-full sm:size-16 ${
                planned
                  ? "border-2 border-dashed border-ink/30 bg-white text-ink/40"
                  : tone === "pop"
                    ? "bg-pop text-ink shadow-[var(--shadow-card)]"
                    : "bg-white text-ink shadow-[var(--shadow-card)]"
              }`}
            >
              <Icon className="size-5 sm:size-6" strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Orbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]" aria-hidden="true">
      {/* Halkalar */}
      <div className="absolute inset-[4%] rounded-full border-2 border-dashed border-ink/20" />
      <div className="absolute inset-[23%] rounded-full border-2 border-dashed border-pop-deep/60" />
      <div className="absolute inset-[38%] rounded-full bg-pop/40 blur-2xl" />

      {/* Dış halka: satış kanalları */}
      <div className="spin-slow absolute inset-[4%]">
        {distribution.channels.map((n, i) => (
          <Satellite key={n.label} node={n} Icon={channelIcons[i]} angle={i * 72 + 18} counter="spin-slow-rev" tone="ink" />
        ))}
      </div>

      {/* İç halka: tedarikçiler (ters yönde) */}
      <div className="spin-90-rev absolute inset-[23%]">
        {distribution.sources.map((n, i) => (
          <Satellite key={n.label} node={n} Icon={sourceIcons[i]} angle={i * 72} counter="spin-90" tone="pop" />
        ))}
      </div>

      {/* Merkez */}
      <div className="absolute inset-[36%] grid place-items-center rounded-full bg-ink text-white ring-[12px] ring-pop/25 shadow-[var(--shadow-photo)]">
        <div className="flex flex-col items-center gap-1.5">
          <LogoMark className="size-10 sm:size-12" tone="pop" />
          <span className="text-lg font-extrabold tracking-tight sm:text-2xl">seyyah</span>
        </div>
      </div>
    </div>
  );
}

function List({ title, nodes }: { title: string; nodes: Node[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold tracking-wide uppercase">{title}</h3>
      <ul className="mt-4 flex flex-col">
        {nodes.map((n) => (
          <li key={n.label} className="flex items-center gap-3 border-b border-ink/10 py-3 text-[16.5px] last:border-0">
            <SailBullet className={`size-4.5 shrink-0 ${n.status === "live" ? "text-ink" : "text-ink/30"}`} />
            <span className={n.status === "live" ? "" : "text-ink-3"}>{n.label}</span>
            <span className="ml-auto">
              <StatusTag status={n.status} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Distribution() {
  return (
    <section id="dagitim" aria-labelledby="dagitim-baslik" className="overflow-hidden py-24 sm:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div>
          <Heading id="dagitim-baslik">{"Tek Entegrasyon.\nDaha Geniş Bir Satış Ağı."}</Heading>
          <p data-reveal style={delay(150)} className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
            Seyyah, turizm tedarikçileri ile satış kanalları arasında bağlantı kuran merkezi bir dağıtım altyapısı
            oluşturmayı hedefler.
          </p>
          <div data-reveal style={delay(250)} className="mt-10 grid gap-8 sm:grid-cols-2">
            <List title="Tedarik tarafı" nodes={distribution.sources} />
            <List title="Satış tarafı" nodes={distribution.channels} />
          </div>
        </div>
        <div data-reveal style={delay(100)} className="px-6 sm:px-10">
          <Orbit />
        </div>
      </Container>
    </section>
  );
}
