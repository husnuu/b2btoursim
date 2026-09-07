import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Şifre sıfırlama — Kontuar" };

export default function SifreSifirlamaPage() {
  return <ResetForm />;
}
