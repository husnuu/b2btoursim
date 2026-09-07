import type { ReactNode } from "react";

/**
 * İç araç tablosu. Extranet'in DataTable'ı kadar iş yapmıyor
 * (sanallaştırma yok, kayıt sayısı düşük) ama aynı yoğunluk ve
 * kolon hizasını kullanıyor.
 */
export function AdminTable({
  columns,
  children,
  caption,
}: {
  columns: { key: string; label: string; align?: "start" | "end"; width?: string }[];
  children: ReactNode;
  caption?: string;
}) {
  return (
    <table className="w-full border-collapse font-dense">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              className={`py-1.5 font-normal ${c.align === "end" ? "text-end" : "text-start"} ${
                c.width ?? ""
              } px-2 first:ps-0 last:pe-0`}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function AdminRow({ children }: { children: ReactNode }) {
  return (
    <tr className="h-[var(--row-h)] border-b border-line hover:bg-action-tint">
      {children}
    </tr>
  );
}

export function Cell({
  children,
  align = "start",
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  align?: "start" | "end";
  tone?: "default" | "muted" | "strong";
  className?: string;
}) {
  return (
    <td
      className={`px-2 first:ps-0 last:pe-0 ${align === "end" ? "text-end" : ""} ${
        tone === "muted"
          ? "text-[length:var(--font-ui-sm)] text-ink-2"
          : tone === "strong"
            ? "text-[length:var(--font-ui)] font-semibold text-ink"
            : "text-[length:var(--font-ui)] text-ink"
      } ${className}`}
    >
      {children}
    </td>
  );
}
