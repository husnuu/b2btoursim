import type { Vehicle } from "@/lib/transfer";

export type VehicleStepProps = {
  vehicle: Vehicle;
  onChange: (patch: Partial<Vehicle>) => void;
};
