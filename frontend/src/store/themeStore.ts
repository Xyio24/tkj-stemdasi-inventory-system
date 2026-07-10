import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    /** Resolved theme setelah mempertimbangkan system preference */
    resolvedTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'system',

            setTheme: (theme) => set({ theme }),

            resolvedTheme: () => {
                const { theme } = get();
                if (theme !== 'system') return theme;
                return window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
            },
        }),
        {
            name: 'theme-storage',
            partialize: (state) => ({ theme: state.theme }),
        }
    )
);
