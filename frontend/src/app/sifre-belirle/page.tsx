import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const metadata: Metadata = { title: "Şifre belirle — Kontuar" };

/** Davet ve sıfırlama bağlantıları /auth/confirm üzerinden buraya iner. */
export default function SifreBelirlePage() {
  return <SetPasswordForm />;
}
