import { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
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
    ChevronRight,
    UserCircle,
    BookOpen,
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

// ─── SideNavItem ──────────────────────────────────────────────────────────────

function SideNavItem({ item, onClose }: { item: NavItem; onClose?: () => void }) {
    return (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
                [
                    'group flex items-center gap-2.5 px-3 py-2 rounded-2xl text-sm transition-all duration-200',
                    isActive
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold shadow-glow-blue-sm border border-primary/15 dark:border-primary/25'
                        : 'text-foreground/60 font-medium hover:bg-accent hover:text-foreground',
                ].join(' ')
            }
        >
            {({ isActive }) => (
                <>
                    {/* Icon wrapper */}
                    <span className={[
                        'flex items-center justify-center w-7 h-7 rounded-xl flex-shrink-0 transition-all duration-200',
                        isActive
                            ? 'bg-primary text-primary-foreground shadow-glow-blue-sm'
                            : 'bg-accent/60 text-foreground/50 group-hover:bg-accent group-hover:text-foreground',
                    ].join(' ')}>
                        {item.icon}
                    </span>

                    <span className="flex-1 leading-none">{item.label}</span>

                    <ChevronRight className={[
                        'w-3 h-3 transition-all duration-200',
                        isActive ? 'opacity-60 text-primary' : 'opacity-0 group-hover:opacity-40',
                    ].join(' ')} />
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
        <div className="flex flex-col h-full">

            {/* ── Logo ── */}
            <div className="px-4 py-5">
                <div className="flex items-center gap-3 px-1">
                    {/* Logo badge — glass pill */}
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-glow-blue-sm">
                            <img src="/tkj.svg" alt="TKJ" className="w-5 h-5 object-contain brightness-0 invert" />
                        </div>
                        {/* Subtle glow ring */}
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 pointer-events-none" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground leading-none tracking-tight">
                            Inventory TKJ
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize font-medium">
                            {role}
                        </p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-border/60" />

            {/* ── Nav groups ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
                {NAV_GROUPS.map(group => {
                    if (group.roles && !group.roles.includes(role)) return null;

                    const visibleItems = group.items.filter(
                        item => !item.roles || item.roles.includes(role)
                    );
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.label}>
                            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 select-none">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {visibleItems.map(item => (
                                    <SideNavItem key={item.to} item={item} onClose={onClose} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Divider */}
            <div className="mx-4 h-px bg-border/60" />

            {/* ── User profile + logout ── */}
            <div className="px-3 py-3">
                {/* User info */}
                <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-2xl hover:bg-accent transition-all duration-200 cursor-default">
                    <div className="flex-shrink-0">
                        {user?.avatar && user.avatar_type === 'upload' ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-2xl object-cover ring-2 ring-border"
                            />
                        ) : user ? (
                            <GeneratedAvatar name={user.name} email={user.email} size={32} />
                        ) : (
                            <div className="w-8 h-8 rounded-2xl bg-muted" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate leading-none">
                            {user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {user?.email}
                        </p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-sm font-medium text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15 transition-all duration-200 active:scale-[0.97] group"
                >
                    <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-destructive/8 dark:bg-destructive/15 flex-shrink-0 group-hover:bg-destructive/15 transition-all duration-200">
                        <LogOut className="w-4 h-4" />
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
        <div className="h-dvh bg-mesh-calm flex overflow-hidden">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 fixed inset-y-0 left-0 z-30 glass-sidebar">
                <SidebarContent role={role} />
            </aside>

            {/* ── Mobile Overlay (blurred backdrop) ── */}
            <div
                className={[
                    'fixed inset-0 z-40 lg:hidden transition-all duration-300',
                    sidebarOpen
                        ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/30'
                        : 'opacity-0 pointer-events-none',
                ].join(' ')}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />

            {/* ── Mobile Sidebar Drawer ── */}
            <aside
                className={[
                    'fixed inset-y-0 left-0 z-50 w-64 lg:hidden',
                    'glass-sidebar',
                    'transition-transform duration-300 ease-ios',
                    sidebarOpen ? 'translate-x-0 shadow-float' : '-translate-x-full',
                ].join(' ')}
                aria-label="Navigasi"
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

            {/* ── Main Content Area ── */}
            <div className="flex-1 min-w-0 flex flex-col h-full lg:pl-64">

                {/* ── Mobile Topbar ── */}
                <header className="lg:hidden flex-shrink-0 z-20 glass-topbar h-14 flex items-center gap-3 px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.93]"
                        aria-label="Buka menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-glow-blue-sm">
                            <img src="/tkj.svg" alt="TKJ" className="w-4 h-4 object-contain brightness-0 invert" />
                        </div>
                        <span className="font-bold text-sm text-foreground tracking-tight truncate">
                            Inventory TKJ
                        </span>
                    </div>

                    <div className="flex-shrink-0">
                        {user?.avatar && user.avatar_type === 'upload' ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-2xl object-cover ring-2 ring-border"
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
