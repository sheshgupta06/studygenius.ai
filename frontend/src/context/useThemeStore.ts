import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/types";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",

      setTheme: (theme: Theme) => {
        // Apply to <html> element for CSS variable switching
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(next);
        set({ theme: next });
      },
    }),
    {
      name: "studygenius-theme",
      onRehydrateStorage: () => (state) => {
        // Re-apply theme class on page load from persisted storage
        if (state) {
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(state.theme);
        }
      },
    },
  ),
);
