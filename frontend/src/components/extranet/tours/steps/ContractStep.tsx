"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextAreaField } from "@/components/primitives/Field";
import { formatDate } from "@/lib/i18n";
import type { StepProps } from "./shared";

/**
 * 5.6 Sözleşme — hizmet şartları / sorumluluk reddi metni.
 *
 * Hukuki uyuşmazlıklarda hangi metnin onaylandığının kanıtlanabilmesi için
 * her "Kaydet"te versiyon numarası artırılır; ara tuşlamalar versiyon
 * yaratmaz, yalnızca açık kaydetme aksiyonu yaratır.
 */
export function ContractStep({ draft, onChange }: StepProps) {
  const [text, setText] = useState(draft.contract?.text ?? "");
  const dirty = text !== (draft.contract?.text ?? "");

  const save = () => {
    onChange({
      contract: {
        text,
        version: (draft.contract?.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Hizmet şartları / sorumluluk reddi metni"
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        hint="Müşterinin rezervasyon tamamlamadan önce onaylaması gereken metin."
      />
      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={!dirty}>
          Kaydet (yeni versiyon)
        </Button>
        {draft.contract && (
          <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
            v{draft.contract.version} · son güncelleme {formatDate(draft.contract.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
