import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useThemeOverlay } from '@/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();
    const { showOverlay }     = useThemeOverlay();
    const isDark              = theme === 'dark';

    function toggle() {
        const next = isDark ? 'light' : 'dark';
        showOverlay(next, () => setTheme(next));
    }

    return (
        <button
            onClick={toggle}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            aria-label="Toggle dark mode"
            className={[
                'p-2.5 rounded-2xl transition-all duration-150 active:scale-[0.93]',
                'bg-white/30 dark:bg-white/[0.06]',
                'border border-white/50 dark:border-white/[0.10]',
                'shadow-[inset_0_1px_0_oklch(1_0_0/0.60)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
                'backdrop-blur-sm',
                'hover:bg-white/50 dark:hover:bg-white/[0.10]',
                'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.80),0_2px_8px_oklch(0.13_0.01_260/0.08)]',
            ].join(' ')}
        >
            {isDark
                ? <Sun  className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
    );
}

export default function GuestLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="relative min-h-dvh bg-mesh overflow-hidden">
            {/* ── Animated blobs — warna menyesuaikan tema ── */}
            <div
                className="blob w-[600px] h-[600px] -top-32 -left-32 opacity-60 dark:opacity-40"
                style={{ background: 'radial-gradient(circle, oklch(0.75 0.12 264) 0%, transparent 70%)' }}
            />
            <div
                className="blob w-[500px] h-[500px] top-1/3 -right-48 opacity-40 dark:opacity-25"
                style={{
                    background: 'radial-gradient(circle, oklch(0.72 0.14 290) 0%, transparent 70%)',
                    animationDelay: '-4s',
                }}
            />
            <div
                className="blob w-[400px] h-[400px] -bottom-24 left-1/3 opacity-35 dark:opacity-20"
                style={{
                    background: 'radial-gradient(circle, oklch(0.80 0.10 230) 0%, transparent 70%)',
                    animationDelay: '-8s',
                }}
            />

            {/* ── Theme toggle — pojok kanan atas ── */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            {/* ── Content ── */}
            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
}
