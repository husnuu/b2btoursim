import type { VillaDraft } from "@/lib/villa";

export type VillaStepProps = {
  villa: VillaDraft;
  onChange: (patch: Partial<VillaDraft>) => void;
};
