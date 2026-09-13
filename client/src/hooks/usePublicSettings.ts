import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { PubliekeSiteSettings } from "@shared/schema";

/**
 * De instellingen zoals de publieke site ze krijgt.
 *
 * Dit type komt uit `shared/schema.ts` en wordt daar afgeleid uit hetzelfde register dat de
 * route gebruikt om het antwoord op te bouwen. Er stond hier eerder een handgeschreven
 * interface met alleen `contact`, `hero` en `about` plus een `[key: string]: unknown`-vangnet,
 * en dat vangnet dwong drie pagina's tot een eigen cast om bij `levertijden` te komen. Nu kan
 * het type niet meer uit de pas lopen met wat de server stuurt.
 *
 * Elke sleutel is altijd aanwezig en volledig ingevuld: de route parst door de Zod-schema's
 * heen, dus de standaardwaarden zitten er al in.
 */
export type PublicSettings = PubliekeSiteSettings;

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public", "settings"],
    queryFn: () => api.get<PubliekeSiteSettings>("/api/public/settings"),
    staleTime: 5 * 60_000,
  });
}
