import { ButtonLink } from "@/components/primitives/Button";

/** Prototipte henüz yazılmamış ekranlar için dürüst yer tutucu. */
export function NotBuiltYet({ screen, order }: { screen: string; order: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-2 px-[var(--pad-x)] py-16">
      <h1 className="text-lg font-medium text-ink">{screen} henüz yapılmadı</h1>
      <p className="max-w-[52ch] text-ink-2">{order}</p>
      <ButtonLink href="/extranet" variant="primary" className="mt-3">
        Aramaya dön
      </ButtonLink>
    </div>
  );
}
