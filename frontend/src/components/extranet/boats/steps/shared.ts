import type { BoatDraft } from "@/lib/boat";

export type BoatStepProps = {
  boat: BoatDraft;
  onChange: (patch: Partial<BoatDraft>) => void;
};
