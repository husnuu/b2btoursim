import type { ComponentProps, ReactNode } from "react";

/**
 * `CheckoutView.tsx` / `BookingsTable.tsx`'te tekrar eden input stilini
 * tek yerde toplar — sihirbaz onlarca alanda aynı görünümü kullanıyor.
 */

const inputBase =
  "w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 " +
  "text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 " +
  "focus:border-action disabled:cursor-not-allowed disabled:opacity-45";

function Wrapper({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-danger">
            *
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className="text-[length:var(--font-ui-sm)] text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[length:var(--font-ui-sm)] text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}

type FieldChrome = { label: string; hint?: string; required?: boolean; error?: string };

export function TextField({
  label,
  hint,
  required,
  error,
  className = "",
  ...rest
}: FieldChrome & ComponentProps<"input"> & { className?: string }) {
  return (
    <Wrapper label={label} hint={hint} required={required} error={error}>
      <input className={`h-9 ${inputBase} ${className}`} {...rest} />
    </Wrapper>
  );
}

export function NumberField({
  label,
  hint,
  required,
  error,
  className = "",
  ...rest
}: FieldChrome & ComponentProps<"input"> & { className?: string }) {
  return (
    <Wrapper label={label} hint={hint} required={required} error={error}>
      <input type="number" className={`tnum h-9 ${inputBase} ${className}`} {...rest} />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  hint,
  required,
  error,
  className = "",
  rows = 5,
  ...rest
}: FieldChrome & ComponentProps<"textarea"> & { className?: string }) {
  return (
    <Wrapper label={label} hint={hint} required={required} error={error}>
      <textarea rows={rows} className={`resize-y py-2 ${inputBase} ${className}`} {...rest} />
    </Wrapper>
  );
}

export function SelectField({
  label,
  hint,
  required,
  error,
  className = "",
  children,
  ...rest
}: FieldChrome & ComponentProps<"select"> & { className?: string }) {
  return (
    <Wrapper label={label} hint={hint} required={required} error={error}>
      <select className={`h-9 ${inputBase} ${className}`} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
}
