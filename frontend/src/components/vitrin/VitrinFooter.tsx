"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { LogoMark } from "./Logo";
import { useVitrin } from "./VitrinProvider";
import { AgencyLogo } from "./VitrinChrome";

export function VitrinFooter() {
  const { agency, destinations, categories: vCategories, demo } = useVitrin();
  return (
    <footer id="yardim" className="mt-24 bg-ink text-white">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <AgencyLogo tone="light" />
          <p className="mt-5 max-w-xs text-white/65">{agency.tagline}</p>
          <ul className="mt-6 flex flex-col gap-2 text-white/80">
            <li className="flex items-center gap-2"><Phone className="size-4 text-pop" /> {agency.phone}</li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-pop" /> {agency.email}</li>
          </ul>
        </div>
        <nav aria-label="Destinasyonlar">
          <h2 className="font-bold">Destinasyonlar</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-white/65">
            {destinations.slice(0, 6).map((d) => (
              <li key={d.slug}><Link href={`/magaza/ara?sehir=${d.slug}`} className="hover:text-white">{d.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Kategoriler">
          <h2 className="font-bold">Kategoriler</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-white/65">
            {vCategories.map((c) => (
              <li key={c.key}><Link href={`/magaza/ara?kategori=${c.key}`} className="hover:text-white">{c.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-bold">Yardım</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-white/65">
            <li>Rezervasyon nasıl yapılır?</li>
            <li>İptal ve iade</li>
            <li>Ödeme seçenekleri</li>
            <li>Gizlilik ve KVKK</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 py-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {agency.name}{demo ? " (örnek acente)" : ""}</span>
          <Link href="/" className="flex items-center gap-2 hover:text-white">
            Altyapı <LogoMark className="size-5" tone="pop" /> <b className="font-extrabold tracking-tight text-white">seyyah</b>
          </Link>
        </div>
      </div>
    </footer>
  );
}
