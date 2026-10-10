"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEMO_VITRIN, destNameIn, type VitrinData } from "@/content/vitrin";

/**
 * Vitrin verisi bağlamı. Seyyah'ın bileşenleri `@/content/vitrin`'den sabit
 * veri okuyordu; burada aynı bileşenler aynı şekli bağlamdan okur — örnek
 * vitrinde demo içerik, kiracı vitrininde acentenin yayınladığı ilanlar.
 */
const Ctx = createContext<VitrinData>(DEMO_VITRIN);

export function VitrinProvider({ data, children }: { data: VitrinData; children: ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useVitrin() {
  const data = useContext(Ctx);
  return { ...data, destName: (slug: string) => destNameIn(data.destinations, slug) };
}
