import { listPlans } from "@/lib/admin/load";
import { OnboardingWizard } from "@/components/admin/OnboardingWizard";

export default async function YeniKiraciPage() {
  const plans = await listPlans();
  return <OnboardingWizard plans={plans.filter((p) => p.isActive)} />;
}
