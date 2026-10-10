import Link from "next/link";
import { Logo } from "@/components/landing/ui/Logo";
import { Container } from "@/components/landing/ui/primitives";
import { ApplyButton } from "@/components/landing/application/ApplyButton";

const linkClass = "text-[17px] text-ink transition hover:underline underline-offset-4";

export function Footer() {
  return (
    <footer className="grain relative mt-16 overflow-hidden bg-pop pt-20 text-ink">
      <Container className="relative">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo size="lg" />
            <p className="mt-6 text-[17px] leading-relaxed text-ink-2">
              Seyahat acentelerini, tur operatörlerini ve turizm tedarikçilerini tek bir dijital ekosistemde buluşturan
              B2B turizm satış ve rezervasyon platformu.
            </p>
          </div>

          <nav aria-label="Platform">
            <h2 className="text-xl font-extrabold">Platform</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li><Link href="/hakkimizda" className={linkClass}>Hakkımızda</Link></li>
              <li><Link href="/pazaryeri" className={linkClass}>B2B Pazaryeri</Link></li>
              <li><Link href="/acenteler" className={linkClass}>Acenteler için</Link></li>
              <li><Link href="/tedarikciler" className={linkClass}>Tedarikçiler için</Link></li>
              <li><Link href="/entegrasyonlar" className={linkClass}>Entegrasyonlar</Link></li>
              <li><Link href="/magaza" className={linkClass}>Örnek acente vitrini</Link></li>
            </ul>
          </nav>

          <nav aria-label="İş ortaklığı">
            <h2 className="text-xl font-extrabold">İş Ortaklığı</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li><ApplyButton type="acente" unstyled className={linkClass}>Acente Başvurusu</ApplyButton></li>
              <li><ApplyButton type="tedarikci" unstyled className={linkClass}>Tedarikçi Başvurusu</ApplyButton></li>
              <li><ApplyButton unstyled className={linkClass}>İletişim</ApplyButton></li>
            </ul>
          </nav>

          <nav aria-label="Yasal">
            <h2 className="text-xl font-extrabold">Yasal</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li><Link href="/yasal/gizlilik" className={linkClass}>Gizlilik Politikası</Link></li>
              <li><Link href="/yasal/kullanim-kosullari" className={linkClass}>Kullanım Koşulları</Link></li>
              <li><Link href="/yasal/kvkk" className={linkClass}>KVKK</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-ink/20 pt-6 text-sm text-ink-2 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Seyyah. Tüm hakları saklıdır.</p>
          <p>Fotoğraflar: Unsplash</p>
        </div>
      </Container>

      {/* Dev kelime markası — alttan kırpılmış */}
      <div aria-hidden="true" className="relative mt-6 -mb-[0.24em] text-center font-sans text-[27vw] leading-[0.8] font-extrabold tracking-[-0.07em] text-ink select-none">
        seyyah
      </div>
    </footer>
  );
}
