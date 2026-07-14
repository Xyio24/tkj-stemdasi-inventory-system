import { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useThemeOverlay } from '@/providers/ThemeProvider';
import GeneratedAvatar from '@/components/common/GeneratedAvatar';
import {
    LayoutDashboard,
    Package,
    Tag,
    ClipboardList,
    Users,
    GraduationCap,
    CalendarDays,
    FileBarChart2,
    FileText,
    Boxes,
    Menu,
    X,
    LogOut,
    UserCircle,
    BookOpen,
    Sun,
    Moon,
} from 'lucide-react';

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    end?: boolean;
    roles?: string[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
    roles?: string[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Utama',
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
        ],
    },
    {
        label: 'Inventaris',
        items: [
            { to: '/dashboard/items',      label: 'Barang',   icon: <Package className="w-4 h-4" /> },
            { to: '/dashboard/categories', label: 'Kategori', icon: <Tag className="w-4 h-4" /> },
        ],
    },
    {
        label: 'Peminjaman',
        items: [
            { to: '/dashboard/borrowings', label: 'Peminjaman', icon: <ClipboardList className="w-4 h-4" /> },
        ],
    },
    {
        label: 'Laporan',
        roles: ['guru', 'admin'],
        items: [
            { to: '/dashboard/reports/borrowings', label: 'Lap. Peminjaman',   icon: <FileText      className="w-4 h-4" />, roles: ['guru', 'admin'] },
            { to: '/dashboard/reports/returns',    label: 'Lap. Pengembalian', icon: <FileBarChart2 className="w-4 h-4" />, roles: ['guru', 'admin'] },
            { to: '/dashboard/reports/inventory',  label: 'Lap. Inventaris',   icon: <Boxes         className="w-4 h-4" />, roles: ['guru', 'admin'] },
        ],
    },
    {
        label: 'Master Data',
        roles: ['admin'],
        items: [
            { to: '/dashboard/users',         label: 'Pengguna',     icon: <Users         className="w-4 h-4" />, roles: ['admin'] },
            { to: '/dashboard/classes',        label: 'Kelas',        icon: <GraduationCap className="w-4 h-4" />, roles: ['admin'] },
            { to: '/dashboard/academic-years', label: 'Tahun Ajaran', icon: <CalendarDays  className="w-4 h-4" />, roles: ['admin'] },
        ],
    },
    {
        label: 'Akun',
        items: [
            { to: '/dashboard/profile', label: 'Profil Saya',      icon: <UserCircle className="w-4 h-4" /> },
            { to: '/dashboard/guide',   label: 'Panduan Pengguna', icon: <BookOpen   className="w-4 h-4" /> },
        ],
    },
];

// ─── ThemeToggle ──────────────────────────────────────────────────────────────

function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, setTheme } = useThemeStore();
    const { showOverlay }     = useThemeOverlay();
    const isDark              = theme === 'dark';

    function toggle() {
        const next = isDark ? 'light' : 'dark';
        showOverlay(next, () => setTheme(next));
    }

    if (compact) {
        return (
            <button
                onClick={toggle}
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                aria-label="Toggle dark mode"
                className={[
                    'p-2 rounded-xl transition-all duration-150 active:scale-[0.93]',
                    'text-foreground/60 hover:text-foreground',
                    'hover:bg-white/50 dark:hover:bg-white/8',
                    'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.5)] dark:hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
                    'border border-transparent hover:border-white/30 dark:hover:border-white/8',
                ].join(' ')}
            >
                {isDark
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={[
                'w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-left',
                'transition-all duration-150 ease-out active:scale-[0.98]',
                'text-foreground/60 border border-transparent',
                'hover:text-foreground/90',
                'hover:bg-white/60 dark:hover:bg-white/[0.05]',
                'hover:border-white/50 dark:hover:border-white/[0.07]',
                'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.70)]',
                'dark:hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
                'group',
            ].join(' ')}
        >
            <span className={[
                'flex items-center justify-center w-[26px] h-[26px] rounded-lg flex-shrink-0',
                'transition-all duration-150',
                'bg-black/[0.04] dark:bg-white/[0.06]',
                'group-hover:bg-black/[0.06] dark:group-hover:bg-white/[0.09]',
            ].join(' ')}>
                {isDark
                    ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                    : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </span>
            <span className="flex-1 leading-none tracking-tight">
                Ubah Tema
            </span>
        </button>
    );
}

// ─── SideNavItem ──────────────────────────────────────────────────────────────

function SideNavItem({ item, onClose }: { item: NavItem; onClose?: () => void }) {
    return (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
                [
                    // Base
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm',
                    'transition-all duration-150 ease-out',
                    'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',

                    isActive ? [
                        // Glass capsule — active
                        'font-semibold text-primary',
                        // Frosted glass bg
                        'bg-primary/[0.09] dark:bg-primary/[0.15]',
                        // Premium border
                        'border border-primary/[0.18] dark:border-primary/[0.22]',
                        // Layered shadow: inner specular + outer glow
                        'shadow-[inset_0_1px_0_oklch(1_0_0/0.55),inset_0_-1px_0_oklch(0.545_0.22_264/0.08),0_1px_6px_oklch(0.545_0.22_264/0.12)]',
                        'dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.12),0_1px_6px_oklch(0_0_0/0.25)]',
                    ].join(' ') : [
                        // Idle
                        'font-medium text-foreground/50 dark:text-foreground/45',
                        'border border-transparent',
                        // Hover: glass micro-card lift
                        'hover:text-foreground/90',
                        'hover:bg-white/60 dark:hover:bg-white/[0.05]',
                        'hover:border-white/50 dark:hover:border-white/[0.07]',
                        'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.70),0_1px_4px_oklch(0.13_0.01_260/0.06)]',
                        'dark:hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
                        'hover:-translate-y-px',
                    ].join(' '),
                ].join(' ')
            }
        >
            {({ isActive }) => (
                <>
                    {/* Icon */}
                    <span className={[
                        'flex items-center justify-center w-[26px] h-[26px] rounded-lg flex-shrink-0',
                        'transition-all duration-150 ease-out',
                        isActive
                            ? [
                                // Solid primary with internal highlight
                                'bg-primary text-white',
                                'shadow-[0_2px_6px_oklch(0.545_0.22_264/0.30),inset_0_1px_0_oklch(1_0_0/0.20)]',
                                'dark:shadow-[0_2px_6px_oklch(0.60_0.22_264/0.35),inset_0_1px_0_oklch(1_0_0/0.15)]',
                              ].join(' ')
                            : [
                                'bg-black/[0.04] dark:bg-white/[0.06]',
                                'text-foreground/40 dark:text-foreground/35',
                                'group-hover:bg-black/[0.06] dark:group-hover:bg-white/[0.09]',
                                'group-hover:text-foreground/70',
                              ].join(' '),
                    ].join(' ')}>
                        {item.icon}
                    </span>

                    {/* Label */}
                    <span className="flex-1 leading-none tracking-tight">
                        {item.label}
                    </span>

                    {/* Active indicator dot — subtle */}
                    {isActive && (
                        <span className="w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" />
                    )}
                </>
            )}
        </NavLink>
    );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({ role, onClose }: { role: string; onClose?: () => void }) {
    const logout   = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const user     = useAuthStore(state => state.user);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="flex flex-col h-full select-none">

            {/* ── Header / Logo ── */}
            <div className="flex-shrink-0 px-4 pt-5 pb-4">
                <div className="flex items-center gap-3">
                    {/*
                     * Logo badge — NO bg-primary, NO brightness-0/invert.
                     * Logo SVG tampil warna asli di atas glass surface.
                     * Pakai ring tipis sebagai border, bukan solid bg.
                     */}
                    <div className={[
                        'relative w-9 h-9 rounded-2xl flex-shrink-0 overflow-hidden',
                        'bg-white/35 dark:bg-white/[0.06]',
                        'ring-1 ring-black/[0.08] dark:ring-white/[0.10]',
                        'shadow-[0_2px_8px_oklch(0.13_0.01_260/0.10),inset_0_1px_0_oklch(1_0_0/0.80)]',
                        'dark:shadow-[0_2px_8px_oklch(0_0_0/0.30),inset_0_1px_0_oklch(1_0_0/0.10)]',
                    ].join(' ')}>
                        <img
                            src="/tkj.svg"
                            alt="TKJ"
                            className="w-full h-full object-contain p-1.5"
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-foreground leading-none tracking-tight">
                            Inventory TKJ
                        </p>
                        <p className="text-[11px] text-foreground/40 mt-0.5 capitalize font-medium leading-none">
                            {role}
                        </p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="flex-shrink-0 mx-4 mb-1">
                <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 min-h-0 sidebar-scroll px-3 py-2">
                <div className="space-y-4 pb-2">
                    {NAV_GROUPS.map(group => {
                        if (group.roles && !group.roles.includes(role)) return null;

                        const visibleItems = group.items.filter(
                            item => !item.roles || item.roles.includes(role)
                        );
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.label}>
                                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/35 dark:text-foreground/30">
                                    {group.label}
                                </p>
                                <div className="space-y-px">
                                    {visibleItems.map(item => (
                                        <SideNavItem key={item.to} item={item} onClose={onClose} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Divider */}
            <div className="flex-shrink-0 mx-4 mt-1">
                <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
            </div>

            {/* ── Profile + Logout ── */}
            <div className="flex-shrink-0 px-3 py-3 space-y-0.5">

                {/* Profile row */}
                <div className={[
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-2xl',
                    'transition-all duration-150 ease-out',
                    'border border-transparent',
                    'hover:bg-white/60 dark:hover:bg-white/[0.05]',
                    'hover:border-white/50 dark:hover:border-white/[0.07]',
                    'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.70)]',
                    'dark:hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
                    'cursor-default group',
                ].join(' ')}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {user?.avatar && user.avatar_type === 'upload' ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-xl object-cover ring-1 ring-black/[0.08] dark:ring-white/10"
                            />
                        ) : user ? (
                            <div className="rounded-xl overflow-hidden ring-1 ring-black/[0.08] dark:ring-white/10">
                                <GeneratedAvatar name={user.name} email={user.email} size={32} />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-muted" />
                        )}
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-foreground truncate leading-none">
                            {user?.name}
                        </p>
                        <p className="text-[11px] text-foreground/40 truncate mt-0.5 leading-none">
                            {user?.email}
                        </p>
                    </div>
                </div>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className={[
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-left',
                        'transition-all duration-150 ease-out active:scale-[0.98]',
                        'text-foreground/50 border border-transparent',
                        'hover:text-red-500 dark:hover:text-red-400',
                        'hover:bg-red-50/80 dark:hover:bg-red-500/[0.08]',
                        'hover:border-red-200/50 dark:hover:border-red-500/[0.12]',
                        'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.70)] dark:hover:shadow-none',
                        'group',
                    ].join(' ')}
                >
                    <span className={[
                        'flex items-center justify-center w-[26px] h-[26px] rounded-lg flex-shrink-0',
                        'transition-all duration-150',
                        'bg-black/[0.04] dark:bg-white/[0.06]',
                        'text-foreground/40 group-hover:text-red-500 dark:group-hover:text-red-400',
                        'group-hover:bg-red-100/80 dark:group-hover:bg-red-500/[0.12]',
                    ].join(' ')}>
                        <LogOut className="w-3.5 h-3.5" />
                    </span>
                    Keluar
                </button>
            </div>
        </div>
    );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function DashboardLayout() {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const user            = useAuthStore(state => state.user);
    const [sidebarOpen, setSidebarOpen]   = useState(false);
    const [mounted, setMounted]           = useState(false);
    const location                        = useLocation();

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // Mount animation
    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const role = user?.role ?? 'siswa';

    return (
        /*
         * Layout strategy:
         * - Outer div: h-dvh + overflow-hidden → fixed viewport container
         * - Inner flex column (lg:pl-64): h-full → mengisi tinggi penuh
         * - main: flex-1 + overflow-y-auto → SATU-SATUNYA scrollable area
         * Ini pola yang benar untuk sidebar layout agar mobile scroll bekerja.
         */
        <div className="h-dvh bg-mesh-calm flex overflow-clip">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 fixed inset-y-0 left-0 z-30 glass-sidebar">
                <SidebarContent role={role} />
            </aside>

            {/* ── Mobile Overlay + Sidebar Drawer ── */}
            {/*
             * Teknik: overlay diposisikan relative terhadap sidebar container.
             * Container (w-64) slide bersama sidebar via translateX.
             * Overlay dimulai dari right-edge container (left: 100%) dan melebar ke kanan (right: -100vw).
             * Hasilnya: left edge overlay selalu menempel di tepi kanan sidebar — satu gerakan kohesif.
             */}
            <div
                style={{ willChange: 'transform' }}
                className={[
                    'fixed inset-y-0 left-0 z-40 w-64 lg:hidden',
                    'transition-transform duration-300 ease-out',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
            >
                {/* Overlay — mengembang ke kanan dari tepi sidebar */}
                <div
                    aria-hidden="true"
                    onClick={() => setSidebarOpen(false)}
                    style={{ willChange: 'opacity' }}
                    className={[
                        'absolute inset-y-0 left-full z-0 bg-black/40 backdrop-blur-sm',
                        'transition-opacity duration-300 ease-out',
                        // 100vw cukup untuk menutupi sisa layar di semua ukuran
                        'w-[100vw]',
                        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
                    ].join(' ')}
                />

                {/* Sidebar */}
                <aside
                    aria-label="Navigasi"
                    className="relative z-10 h-full glass-sidebar"
                >
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-4 right-3 p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 z-10"
                        aria-label="Tutup menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <SidebarContent role={role} onClose={() => setSidebarOpen(false)} />
                </aside>
            </div>

            {/* ── Main Content Area ── */}
            <div className="flex-1 min-w-0 flex flex-col h-full lg:pl-64">

                {/* ── Mobile Topbar ── */}
                <header className="lg:hidden flex-shrink-0 z-20 glass-topbar h-14 flex items-center gap-3 px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={[
                            'p-2 rounded-xl transition-all duration-150 active:scale-[0.93]',
                            'text-foreground/60 hover:text-foreground',
                            'bg-white/0 hover:bg-white/50 dark:hover:bg-white/8',
                            'hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.5)] dark:hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
                            'border border-transparent hover:border-white/30 dark:hover:border-white/8',
                        ].join(' ')}
                        aria-label="Buka menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={[
                            'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden',
                            'bg-white/35 dark:bg-white/[0.06]',
                            'ring-1 ring-black/[0.08] dark:ring-white/[0.10]',
                            'shadow-[0_2px_8px_oklch(0.13_0.01_260/0.10),inset_0_1px_0_oklch(1_0_0/0.40)]',
                        ].join(' ')}>
                            <img src="/tkj.svg" alt="TKJ" className="w-full h-full object-contain p-1" />
                        </div>
                        <span className="font-bold text-sm text-foreground tracking-tight truncate">
                            Inventory TKJ
                        </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <ThemeToggle compact />
                        {user?.avatar && user.avatar_type === 'upload' ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-2xl object-cover ring-2 ring-white/40 dark:ring-white/10"
                            />
                        ) : user ? (
                            <GeneratedAvatar name={user.name} email={user.email} size={32} />
                        ) : (
                            <div className="w-8 h-8 rounded-2xl bg-muted" />
                        )}
                    </div>
                </header>

                {/* ── Page Content — satu-satunya area scroll ── */}
                <main
                    className={[
                        'flex-1 min-h-0 overflow-y-auto overflow-x-hidden',
                        'p-4 md:p-6 lg:p-8',
                        'transition-opacity duration-300',
                        mounted ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
