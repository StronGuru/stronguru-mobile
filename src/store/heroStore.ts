import { getHeroData } from "@/src/services/heroService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HeroType } from "../types/heroTypes";

interface HeroState {
  hero: HeroType | null;
  lastFetched: number | null; // Timestamp dell'ultimo fetch
  isHydrated: boolean;
  fetchHero: (forceRefresh?: boolean) => Promise<void>;
}

// ✅ Helper: controlla se serve refresh (ultima fetch prima delle 10am di oggi)
const shouldRefreshHero = (lastFetched: number | null): boolean => {
  if (!lastFetched) return true; // Mai fetchato → refresh

  const now = new Date();
  const today10am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0);
  const lastFetchDate = new Date(lastFetched);

  // Caso 1: Siamo DOPO le 10am oggi, e l'ultimo fetch era PRIMA delle 10am oggi
  if (now >= today10am && lastFetchDate < today10am) {
    return true;
  }

  // Caso 2: L'ultimo fetch era ieri (o prima) → refresh
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);
  if (lastFetchDate <= yesterday) {
    return true;
  }

  return false; // Cache valida
};

export const useHeroStore = create<HeroState>()(
  persist(
    (set, get) => ({
      hero: null,
      lastFetched: null,
      isHydrated: false,

      fetchHero: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // ✅ Controlla se serve refresh basato su orario 10am
        if (!forceRefresh && state.hero && state.lastFetched && !shouldRefreshHero(state.lastFetched)) {
          const lastFetchDate = new Date(state.lastFetched);
          console.log(
            "🔵 Using cached hero data (last updated:",
            lastFetchDate.toLocaleString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }),
            ")"
          );
          set({ isHydrated: true });
          return; // ← Esce subito, cache ancora valida
        }

        // ✅ Fetch da API (passate le 10am oppure forceRefresh)
        try {
          console.log("🔄 Fetching fresh hero data (10am refresh window)...");
          const heroData = await getHeroData();

          if (heroData.length > 0) {
            set({
              hero: heroData[heroData.length - 1],
              lastFetched: now,
              isHydrated: true
            });
            console.log("✅ Hero data updated from API at", new Date(now).toLocaleTimeString("it-IT"));
          } else {
            set({ hero: null, lastFetched: now, isHydrated: true });
            console.log("⚠️ No hero data available");
          }
        } catch (error) {
          console.error("❌ Error fetching hero data:", error);
          // Se fetch fallisce ma hai cache vecchia, la mantieni
          set({ isHydrated: true }); // Hydrate comunque per non bloccare l'app
        }
      }
    }),
    {
      name: "hero-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("✅ Hero store rehydrated from AsyncStorage");
          // Dopo rehydration, controlla se serve refresh
          state.fetchHero();
        }
      }
    }
  )
);
