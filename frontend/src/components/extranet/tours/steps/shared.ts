import type { TourDraft } from "@/lib/tour";

export type StepProps = {
  draft: TourDraft;
  onChange: (patch: Partial<TourDraft>) => void;
};
