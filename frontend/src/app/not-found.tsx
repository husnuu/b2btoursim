import { t } from "@/lib/i18n";
import { ButtonLink } from "@/components/primitives/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-6 py-20">
      <h1 className="text-lg font-medium text-ink">{t("error.notFound.title")}</h1>
      <p className="max-w-[52ch] text-ink-2">{t("error.notFound.body")}</p>
      <ButtonLink href="/" variant="primary" className="mt-3">
        {t("error.notFound.home")}
      </ButtonLink>
    </div>
  );
}
