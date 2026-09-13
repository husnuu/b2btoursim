"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGENCY } from "@/data/mock";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { signOut } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/current-user";
import { BalanceIndicator } from "./BalanceIndicator";

/**
 * `daily: true` olan rotalar önden yüklenir (prefetch), diğerleri tıklanınca.
 *
 * Ray 13 satıra çıkınca hepsinin önden yüklenmesi ilk açılışa ~78KB
 * ekliyordu. Operatör bir oturumda 13 bölümün hepsini gezmiyor: arama,
 * rezervasyon ve bakiye günlük; envanter kurulumu ve ayarlar seyrek.
 * Sıcak yollar anında kalır, uzun kuyruk tıklamada yüklenir.
 */
const NAV: {
  href: string;
  label: MessageKey;
  exact?: boolean;
  daily?: boolean;
}[] = [
  { href: "/extranet", label: "nav.home", exact: true, daily: true },
  { href: "/extranet/arama", label: "nav.search", daily: true },
  { href: "/extranet/turlar", label: "nav.tours" },
  { href: "/extranet/transfer", label: "nav.transfer" },
  { href: "/extranet/tekneler", label: "nav.boats" },
  { href: "/extranet/villalar", label: "nav.villas" },
  { href: "/extranet/vize", label: "nav.visa" },
  { href: "/extranet/pazaryeri", label: "nav.marketplace" },
  { href: "/extranet/rezervasyonlar", label: "nav.bookings", daily: true },
  { href: "/extranet/bakiye", label: "nav.balance", daily: true },
  { href: "/extranet/ekstre", label: "nav.invoices" },
  { href: "/extranet/acenteler", label: "nav.agencies" },
  { href: "/extranet/site", label: "nav.site" },
  { href: "/extranet/ayarlar", label: "nav.settings" },
];

/**
 * Extranet kabuğu.
 *
 * Ray ikonsuz ve metin tabanlı: altı öğe için ikon tanıma maliyeti
 * okumadan yüksek, ve kazanılan piksel tabloya gidiyor. Aktif öğe
 * satır başındaki 2px kural ile işaretlenir — sadece renkle değil.
 */
export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { lines } = useCart();
  // Kiracı adı oturumdan; bakiye ve cari hâlâ mock (finans bağlanınca değişir).
  const agencyName = user.agencyName ?? AGENCY.name;

  return (
    <div data-density="compact" className="flex min-h-dvh bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2
                   focus:rounded-[var(--radius)] focus:bg-action focus:px-3 focus:py-2 focus:text-on-action"
      >
        {t("nav.skipToContent")}
      </a>

      <nav
        aria-label={t("app.name")}
        className="sticky top-0 hidden h-dvh w-44 shrink-0 flex-col border-e border-line bg-surface md:flex"
      >
        <div className="border-b border-line px-3 py-3">
          {/* Tenant logo yuvası: white-label MVP'de logo + marka rengi. */}
          <p className="font-dense text-base font-semibold leading-none text-ink">
            {agencyName}
          </p>
          <p className="mt-1 text-[length:var(--font-ui-xs)] text-ink-3">
            {t("app.tagline")}
          </p>
        </div>

        <ul className="flex flex-col py-2">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={item.daily ? undefined : false}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-8 items-center border-s-2 ps-3 pe-2 text-[length:var(--font-ui)] transition-colors ${
                    active
                      ? "border-s-action bg-action-tint font-medium text-ink"
                      : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"
                  }`}
                >
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-line p-3">
          <Link
            href="/magaza"
            className="text-[length:var(--font-ui-sm)] text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            {t("nav.storefront")}
          </Link>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-4 border-b border-line bg-surface px-[var(--pad-x)]">
          <p className="font-dense text-sm font-semibold text-ink md:hidden">
            {agencyName}
          </p>

          <p className="hidden text-[length:var(--font-ui-sm)] text-ink-3 md:block">
            {t("search.shortcutHint", { key: "/" })}
          </p>

          <div className="ms-auto flex items-center gap-4">
            <Link
              href="/extranet/sepet"
              className="tnum flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-line-strong
                         bg-surface px-2 text-[length:var(--font-ui-sm)] text-ink-2 hover:bg-sunken hover:text-ink"
            >
              {t("cart.title")}
              <span
                className={`tnum inline-grid h-4 min-w-4 place-items-center rounded-[2px] px-1 text-[length:var(--font-ui-xs)] font-semibold ${
                  lines.length ? "bg-action text-on-action" : "bg-sunken text-ink-3"
                }`}
              >
                {lines.length}
              </span>
            </Link>

            <BalanceIndicator
              balance={AGENCY.balance}
              creditLimit={AGENCY.creditLimit}
              currency={AGENCY.currency}
            />

            <div className="hidden flex-col items-end leading-none lg:flex">
              <span className="text-[length:var(--font-ui-sm)] text-ink">{user.fullName}</span>
              <span className="mt-0.5 text-[length:var(--font-ui-xs)] text-ink-3">
                {t(`role.${user.role}` as MessageKey)}
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="h-7 rounded-[var(--radius)] border border-transparent px-2
                           text-[length:var(--font-ui-sm)] text-ink-3 hover:border-line-strong hover:text-ink"
              >
                {t("user.signOut")}
              </button>
            </form>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
