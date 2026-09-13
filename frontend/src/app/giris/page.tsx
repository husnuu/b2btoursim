import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { safeNext } from "@/lib/auth/claims";

export const metadata: Metadata = { title: "Acente girişi — Kontuar" };

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next, "");
  return <SignInForm next={next || undefined} linkError={params.error === "link"} />;
}
