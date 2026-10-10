"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { nav, type NavLink } from "@/content/site";
import { Logo } from "@/components/landing/ui/Logo";
import { Container, buttonClass } from "@/components/landing/ui/primitives";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { useApplication } from "@/components/landing/application/ApplicationProvider";

export function Header() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const { open: openApplication } = useApplication();
  const last = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const [menuTop, setMenuTop] = useState(132);
  const closeTimer = useRef<number | undefined>(undefined);

  // Rota değişince menüler kapanır
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setMega(null);
  }

  // Aşağı kaydırırken menü toplanır, yukarı kaydırınca geri gelir
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 120) setCompact(false);
      else if (y > last.current + 6) {
        setCompact(true);
        setMega(null);
      } else if (y < last.current - 6) setCompact(false);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMega(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mega]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      document.body.style.overflow = "";
    };
  }, [open]);

  const openMega = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setMega(label);
  };
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setMega(null), 160);
  };

  const active = (href: string) => (href.startsWith("/#") ? false : pathname === href || pathname.startsWith(href + "/"));
  const megaItem = nav.find((n) => n.label === mega && n.children);

  return (
    <>
      <div className="relative z-50 bg-ink text-white">
        <Container className="flex h-11 items-center justify-center gap-3 text-[13px] sm:text-sm">
          <span className="truncate text-white/85">Seyyah&apos;ın ilk iş ortaklarından biri olmak ister misiniz?</span>
          <button
            type="button"
            onClick={() => openApplication()}
            className="btn-arrow inline-flex shrink-0 items-center gap-1.5 font-semibold text-pop underline-offset-4 hover:underline"
          >
            Başvurun <ArrowRight className="size-3.5" />
          </button>
        </Container>
      </div>

      <header ref={headerRef} style={{ viewTransitionName: "site-header" }} className="sticky top-0 z-40 bg-pop">
        <Container className={`flex items-center gap-8 transition-[height] duration-500 ${compact ? "h-[68px]" : "h-[88px]"}`}>
          <Link href="/" aria-label="Seyyah ana sayfa" className="shrink-0">
            <Logo />
          </Link>

          <nav
            aria-label="Ana menü"
            className={`hidden transition-[opacity,translate] duration-500 lg:block ${
              compact ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100"
            }`}
          >
            <ul className="flex items-center gap-0.5">
              {nav.map((item) => (
                <li key={item.label} onPointerEnter={() => item.children && openMega(item.label)} onPointerLeave={() => item.children && scheduleClose()}>
                  {item.children ? (
                    <button
                      type="button"
                      tabIndex={compact ? -1 : undefined}
                      aria-expanded={mega === item.label}
                      aria-controls="mega-menu"
                      onClick={() => setMega((m) => (m === item.label ? null : item.label))}
                      className="group relative flex items-center gap-1 px-3 py-2 text-[15.5px] font-medium text-ink"
                    >
                      {item.label}
                      <ChevronDown className={`size-4 transition-transform duration-300 ${mega === item.label ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      tabIndex={compact ? -1 : undefined}
                      aria-current={active(item.href) ? "page" : undefined}
                      className="group relative block px-3 py-2 text-[15.5px] font-medium text-ink"
                    >
                      {item.label}
                      <span
                        className={`absolute inset-x-3 -bottom-0.5 h-[2px] origin-left bg-ink transition-transform duration-300 group-hover:scale-x-100 ${
                          active(item.href) ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/giris"
              className={`hidden px-3 py-2 text-[15.5px] font-medium text-ink transition-opacity duration-300 hover:underline sm:inline-flex ${
                compact ? "lg:pointer-events-none lg:opacity-0" : ""
              }`}
            >
              Giriş Yap
            </Link>
            <span className="hidden sm:block">
              <ApplyButton className="whitespace-nowrap">Ücretsiz Başvur</ApplyButton>
            </span>
            <button
              type="button"
              onClick={() => {
                setMenuTop(headerRef.current?.getBoundingClientRect().bottom ?? 132);
                setOpen((o) => !o);
              }}
              aria-expanded={open}
              aria-controls="mobil-menu"
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              className="relative grid size-11 place-items-center rounded-xl text-ink lg:hidden"
            >
              <span className={`absolute h-[2.5px] w-6 rounded bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[5px]"}`} />
              <span className={`absolute h-[2.5px] w-6 rounded bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[5px]"}`} />
            </button>
          </div>
        </Container>

        {/* Mega menü */}
        {megaItem?.children && (
          <div
            id="mega-menu"
            onPointerEnter={() => openMega(megaItem.label)}
            onPointerLeave={scheduleClose}
            className="menu-in absolute inset-x-0 top-full hidden border-t border-ink/10 bg-pop shadow-[var(--shadow-lift)] lg:block"
          >
            <Container className="grid grid-cols-[1fr_1fr_0.8fr] gap-6 py-8">
              {megaItem.children.map((c, i) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group flex items-center gap-5 rounded-2xl bg-white/60 p-4 transition-colors hover:bg-white"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className={`polaroid relative block size-24 shrink-0 p-1.5 transition-transform duration-500 group-hover:rotate-0 ${i % 2 ? "rotate-[4deg]" : "-rotate-[4deg]"}`}>
                    <span className="relative block size-full">
                      <Image src={c.image} alt="" fill sizes="96px" className="object-cover" />
                    </span>
                  </span>
                  <span className="flex-1">
                    <span className="font-display block text-2xl">{c.label}</span>
                    <span className="mt-1 block text-[15px] text-ink-2">{c.desc}</span>
                  </span>
                  <ArrowRight className="size-5 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              ))}
              <div className="flex flex-col justify-between rounded-2xl bg-ink p-6 text-white">
                <p className="font-display text-2xl leading-tight">Hangisi olduğunuzdan emin değil misiniz?</p>
                <p className="text-[15px] text-white/70">Seyyah&apos;ta aynı hesapla hem alıcı hem satıcı olabilirsiniz.</p>
              </div>
            </Container>
          </div>
        )}

        {/* Kaydırma ilerlemesi */}
        <span aria-hidden="true" className="scroll-bar absolute inset-x-0 bottom-0 h-[3px] bg-ink" />
      </header>

      <div id="mobil-menu" hidden={!open} style={{ top: menuTop }} className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-ink/10 bg-pop lg:hidden">
        <Container className="flex flex-col py-6">
          <nav aria-label="Mobil menü">
            <ul className="flex flex-col">
              {nav.flatMap<NavLink>((item) => item.children ?? [item]).map((item, i) => (
                <li key={item.href} className="tab-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-ink/15 py-4 font-display text-[1.9rem] text-ink"
                  >
                    {item.label}
                    <ArrowRight className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 flex flex-col gap-3" onClick={() => setOpen(false)}>
            <ApplyButton size="lg">Ücretsiz Başvur</ApplyButton>
            <Link href="/giris" className={buttonClass("outline", "lg")}>
              Giriş Yap
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
