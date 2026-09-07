"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextAreaField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import { generateSocialPost } from "@/lib/ai-mock";
import { formatDate } from "@/lib/i18n";
import type { StepProps } from "./shared";

/**
 * 5.4 Sosyal Medya Gönderileri — mock AI taslak üretimi.
 *
 * Bağlı sosyal medya hesabı yok (bkz. READINESS.md); bu yüzden gerçek bir
 * "paylaşıldı" iddiası yapılmaz — yalnızca kopyalanabilir bir taslak üretilir.
 */
export function SocialMediaStep({ draft, onChange }: StepProps) {
  const { notify } = useToast();
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      onChange({
        socialPostDraft: {
          text: generateSocialPost(draft),
          generatedAt: new Date().toISOString(),
        },
      });
      setGenerating(false);
    }, 500);
  };

  const copy = async () => {
    if (!draft.socialPostDraft) return;
    try {
      await navigator.clipboard.writeText(draft.socialPostDraft.text);
      notify("Gönderi metni panoya kopyalandı.");
    } catch {
      notify("Kopyalanamadı — metni elle seçip kopyalayın.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" onClick={generate} disabled={generating}>
          {generating ? "Üretiliyor…" : draft.socialPostDraft ? "Yeniden üret" : "Gönderi taslağı üret"}
        </Button>
        {draft.socialPostDraft && (
          <span className="text-[length:var(--font-ui-sm)] text-ink-3">
            Son üretim: {formatDate(draft.socialPostDraft.generatedAt)}
          </span>
        )}
      </div>

      {draft.socialPostDraft && (
        <>
          <TextAreaField
            label="Gönderi metni"
            rows={5}
            value={draft.socialPostDraft.text}
            onChange={(e) =>
              onChange({
                socialPostDraft: { ...draft.socialPostDraft!, text: e.target.value },
              })
            }
          />
          <Button type="button" size="sm" className="self-start" onClick={copy}>
            Panoya kopyala
          </Button>
        </>
      )}

      <p className="text-[length:var(--font-ui-sm)] text-ink-3">
        Bağlı sosyal medya hesabı bulunmuyor; taslak onaylandıktan sonra
        indirilip manuel paylaşılabilir.
      </p>
    </div>
  );
}
