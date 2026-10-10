"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { useVitrin } from "./VitrinProvider";

const norm = (s: string) => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Destinasyon ve ürün önerili arama kutusu (combobox). */
export function SearchBox({ variant = "header" }: { variant?: "header" | "hero" }) {
  const router = useRouter();
  const { destinations, products, destName } = useVitrin();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const blurTimer = useRef<number | undefined>(undefined);

  const results = useMemo(() => {
    const n = norm(q.trim());
    const dests = destinations.filter((d) => !n || norm(d.name).includes(n)).slice(0, n ? 3 : 4);
    const prods = n
      ? products.filter((p) => norm(p.title + " " + destName(p.city) + " " + p.summary).includes(n)).slice(0, 4)
      : products.filter((p) => p.badge).slice(0, 3);
    return [
      ...dests.map((d) => ({ kind: "dest" as const, href: `/magaza/ara?sehir=${d.slug}`, title: d.name, sub: "Destinasyon", image: d.image })),
      ...prods.map((p) => ({ kind: "prod" as const, href: `/magaza/urun/${p.slug}`, title: p.title, sub: destName(p.city), image: p.image })),
    ];
  }, [q, destinations, products, destName]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) go(results[active].href);
      else go(`/magaza/ara${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    } else if (e.key === "Escape") setOpen(false);
  };

  const hero = variant === "hero";

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center gap-3 transition-shadow ${
          hero
            ? "h-16 rounded-2xl bg-white px-5 shadow-[var(--shadow-lift)] focus-within:ring-4 focus-within:ring-pop sm:h-[72px] sm:px-6"
            : "h-11 rounded-xl bg-mist px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-ink"
        }`}
      >
        <Search className={hero ? "size-6 shrink-0" : "size-5 shrink-0"} />
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label="Deneyim veya destinasyon ara"
          placeholder={hero ? "Nereye gitmek istersiniz?" : "Deneyim ve yer ara"}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            window.clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => (blurTimer.current = window.setTimeout(() => setOpen(false), 150))}
          onKeyDown={onKey}
          className={`min-w-0 flex-1 bg-transparent outline-none focus-visible:outline-none placeholder:text-ink-3 ${hero ? "text-lg italic placeholder:italic sm:text-xl" : "text-[15px] italic placeholder:italic"}`}
        />
        {hero && (
          <button
            type="button"
            onClick={() => go(`/magaza/ara${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)}
            className="hidden h-11 rounded-xl bg-ink px-6 font-semibold text-white transition-colors hover:bg-ink-2 sm:block"
          >
            Ara
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="menu-in absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-2 shadow-[var(--shadow-lift)] ring-1 ring-ink/5"
        >
          {!q && <li className="px-3 pt-2 pb-1 text-xs font-bold tracking-wide text-ink-3 uppercase">Popüler</li>}
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r.href)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl p-2 ${i === active ? "bg-mist" : ""}`}
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.title}</span>
                <span className="flex items-center gap-1 text-sm text-ink-3">
                  {r.kind === "dest" && <MapPin className="size-3.5" />}
                  {r.sub}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
