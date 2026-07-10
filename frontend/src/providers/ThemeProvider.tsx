import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

/**
 * ThemeProvider — apply class `dark` ke <html> berdasarkan theme store.
 * Juga listen perubahan system preference saat theme = 'system'.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((s) => s.theme);

    useEffect(() => {
        const root = document.documentElement;

        function applyTheme() {
            const isDark =
                theme === 'dark' ||
                (theme === 'system' &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches);

            root.classList.toggle('dark', isDark);
        }

        applyTheme();

        // Kalau system, listen perubahan OS preference
        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            mq.addEventListener('change', applyTheme);
            return () => mq.removeEventListener('change', applyTheme);
        }
    }, [theme]);

    return <>{children}</>;
}
