import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Acente girişi — Kontuar" };

export default function GirisPage() {
  return <SignInForm />;
}
