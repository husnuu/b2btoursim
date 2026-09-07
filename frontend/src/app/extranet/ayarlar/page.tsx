import { AGENCY_USERS, ROLE_TEMPLATES } from "@/data/mock";
import { formatDate, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";

/** Kullanıcı listesi ve rol atama — Sitemap Bölüm 2, /settings/users (MVP). */
const ROLE: Record<string, MessageKey> = {
  platform_admin: "role.platform_admin",
  agency_admin: "role.agency_admin",
  sales: "role.sales",
  accounting: "role.accounting",
};
const USTATUS: Record<string, MessageKey> = {
  active: "userStatus.active",
  invited: "userStatus.invited",
  disabled: "userStatus.disabled",
};

export default function AyarlarPage() {
  return (
    <div className="mx-auto w-full max-w-[76rem] px-[var(--pad-x)] py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-ink">{t("users.title")}</h1>
        <Button variant="primary">{t("users.invite")}</Button>
      </div>

      <table className="mt-5 w-full border-collapse font-dense">
        <thead>
          <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
            <th scope="col" className="w-48 py-1.5 text-start font-normal">{t("users.col.name")}</th>
            <th scope="col" className="px-2 py-1.5 text-start font-normal">{t("users.col.email")}</th>
            <th scope="col" className="w-44 px-2 py-1.5 text-start font-normal">{t("users.col.role")}</th>
            <th scope="col" className="w-32 px-2 py-1.5 text-start font-normal">{t("users.col.status")}</th>
            <th scope="col" className="w-44 py-1.5 text-end font-normal">{t("users.col.lastSeen")}</th>
          </tr>
        </thead>
        <tbody>
          {AGENCY_USERS.map((u) => (
            <tr key={u.id} className="h-[var(--row-h)] border-b border-line hover:bg-action-tint">
              <td className="text-[length:var(--font-ui)] text-ink">{u.fullName}</td>
              <td className="truncate px-2 text-[length:var(--font-ui-sm)] text-ink-2">{u.email}</td>
              <td className="px-2">
                <select
                  defaultValue={u.role}
                  aria-label={`${u.fullName} ${t("users.col.role")}`}
                  className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-1.5
                             text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                >
                  {Object.entries(ROLE)
                    .filter(([key]) => key !== "platform_admin")
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {t(label)}
                      </option>
                    ))}
                </select>
              </td>
              <td className="px-2">
                <span
                  className={`text-[length:var(--font-ui-sm)] ${
                    u.status === "active"
                      ? "text-success"
                      : u.status === "invited"
                        ? "text-warning"
                        : "text-ink-3"
                  }`}
                >
                  {t(USTATUS[u.status])}
                </span>
              </td>
              <td className="tnum text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {u.lastSeenAt ? formatDate(u.lastSeenAt) : t("users.never")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-10">
        <h2 className="mb-2 font-dense text-base font-medium text-ink">
          {t("admin.roles.title")}
        </h2>
        <p className="mb-3 max-w-[62ch] text-ink-2">{t("admin.roles.lead")}</p>
        <ul className="border-t border-line font-dense">
          {ROLE_TEMPLATES.filter((r) => r.role !== "platform_admin").map((r) => (
            <li
              key={r.role}
              className="grid gap-1 border-b border-line py-2.5 sm:grid-cols-[12rem_1fr] sm:gap-6"
            >
              <span className="text-[length:var(--font-ui)] text-ink">{t(ROLE[r.role])}</span>
              <span className="flex flex-wrap gap-1.5">
                {r.scopes.map((sc) => (
                  <code
                    key={sc}
                    className="rounded-[2px] border border-line bg-sunken px-1.5 text-[length:var(--font-ui-xs)] text-ink-2"
                  >
                    {sc}
                  </code>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
