import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ContactSettings, HeroSettings, AboutSettings } from "@shared/schema";

export interface PublicSettings {
  contact?: ContactSettings;
  hero?: HeroSettings;
  about?: AboutSettings;
  [key: string]: unknown;
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public", "settings"],
    queryFn: () => api.get<PublicSettings>("/api/public/settings"),
    staleTime: 5 * 60_000,
  });
}
