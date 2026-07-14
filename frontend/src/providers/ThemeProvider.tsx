import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';

const FADE_MS  = 220;  // fade in / fade out duration
const HOLD_MS  = 600;  // how long overlay stays at full opacity

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeCtx {
    showOverlay: (nextTheme: 'light' | 'dark', onPeak: () => void) => void;
}

export const ThemeProviderContext = createContext<ThemeCtx>({
    showOverlay: (_n, onPeak) => onPeak(),
});

export function useThemeOverlay() {
    return useContext(ThemeProviderContext);
}

// ─── Overlay Content ──────────────────────────────────────────────────────────

function OverlayContent({
    nextTheme,
    opaque,
}: {
    nextTheme: 'light' | 'dark';
    opaque: boolean;
}) {
    const isDark = nextTheme === 'dark';

    return (
        <div
            style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                height:         '100%',
                gap:            '16px',
                opacity:         opaque ? 1 : 0,
                transform:       opaque ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(12px)',
                transition:      `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms cubic-bezier(0.34, 1.4, 0.64, 1)`,
                // slight delay so it appears after overlay itself fades in
                transitionDelay: opaque ? '60ms' : '0ms',
            }}
        >
            {/* Icon */}
            <div
                style={{
                    width:           '72px',
                    height:          '72px',
                    borderRadius:    '24px',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    background:      isDark
                        ? 'oklch(0.22 0.03 264 / 0.8)'
                        : 'oklch(0.92 0.04 90 / 0.8)',
                    boxShadow:       isDark
                        ? '0 8px 32px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.08)'
                        : '0 8px 32px oklch(0.80 0.12 90 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.70)',
                    backdropFilter:  'blur(12px)',
                }}
            >
                {isDark ? (
                    /* Moon SVG */
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDark ? 'oklch(0.85 0.08 264)' : 'oklch(0.55 0.18 90)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                ) : (
                    /* Sun SVG */
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.20 65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1"  x2="12" y2="3"  />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1"  y1="12" x2="3"  y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
                        <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
                    </svg>
                )}
            </div>

            {/* Label */}
            <p
                style={{
                    margin:      0,
                    fontSize:    '15px',
                    fontWeight:  600,
                    letterSpacing: '0.01em',
                    color:       isDark
                        ? 'oklch(0.85 0.005 247)'
                        : 'oklch(0.22 0.01 260)',
                    fontFamily:  'inherit',
                }}
            >
                {isDark ? 'Mode Gelap' : 'Mode Terang'}
            </p>
        </div>
    );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((s) => s.theme);

    const [visible,    setVisible]    = useState(false);
    const [opaque,     setOpaque]     = useState(false);
    const [nextTheme,  setNextTheme]  = useState<'light' | 'dark'>('light');
    const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
    const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Apply on initial mount only — subsequent changes handled synchronously in showOverlay
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => {
        if (t1.current) clearTimeout(t1.current);
        if (t2.current) clearTimeout(t2.current);
    }, []);

    function showOverlay(next: 'light' | 'dark', onPeak: () => void) {
        if (t1.current) clearTimeout(t1.current);
        if (t2.current) clearTimeout(t2.current);

        setNextTheme(next);
        setVisible(true);
        setOpaque(false);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setOpaque(true);

                // Hold at full opacity, apply theme, then fade out
                t1.current = setTimeout(() => {
                    // Apply DOM class synchronously BEFORE fade-out starts
                    // This ensures zero color flash when overlay lifts
                    document.documentElement.classList.toggle('dark', next === 'dark');
                    onPeak();     // persist to store
                    setOpaque(false);

                    t2.current = setTimeout(() => {
                        setVisible(false);
                    }, FADE_MS + 20);
                }, FADE_MS + HOLD_MS);
            });
        });
    }

    const isDark = nextTheme === 'dark';
    const bg = isDark ? 'oklch(0.16 0.01 260)' : 'oklch(0.985 0.002 247)';

    return (
        <>
            <ThemeProviderContext.Provider value={{ showOverlay }}>
                {children}
            </ThemeProviderContext.Provider>

            {visible && (
                <div
                    aria-hidden="true"
                    style={{
                        position:      'fixed',
                        inset:         0,
                        zIndex:        99999,
                        background:    bg,
                        pointerEvents: 'none',
                        opacity:       opaque ? 1 : 0,
                        transition:    `opacity ${FADE_MS}ms ease-in-out`,
                    }}
                >
                    <OverlayContent nextTheme={nextTheme} opaque={opaque} />
                </div>
            )}
        </>
    );
}
