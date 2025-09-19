import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LanguageCode = string;

export type ThemeName = 'default' | 'resq' | 'green' | 'red' | 'magenta' | 'blue' | 'yellow';

interface SettingsState {
  language: LanguageCode;
  theme: ThemeName;
  darkMode: boolean;
  setLanguage: (language: LanguageCode) => void;
  setTheme: (theme: ThemeName) => void;
  setDarkMode: (darkMode: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'default',
      darkMode: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    {
      name: 'app-settings',
      partialize: (state) => ({ language: state.language, theme: state.theme, darkMode: state.darkMode }),
    }
  )
);
