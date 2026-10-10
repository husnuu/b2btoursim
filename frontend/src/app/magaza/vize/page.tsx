import { ModuleListPage } from "@/components/b2c/ModuleListPage";

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ModuleListPage kind="visa" fallbackTitle="Vize hizmetleri" searchParams={searchParams} />;
}
