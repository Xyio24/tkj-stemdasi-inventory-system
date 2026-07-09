import { useState } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
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
    roles?: string[];   // undefined = semua role
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
            { to: '/dashboard/reports/borrowings', label: 'Lap. Peminjaman',  icon: <FileText className="w-4 h-4" />,     roles: ['guru', 'admin'] },
            { to: '/dashboard/reports/returns',    label: 'Lap. Pengembalian',icon: <FileBarChart2 className="w-4 h-4" />, roles: ['guru', 'admin'] },
            { to: '/dashboard/reports/inventory',  label: 'Lap. Inventaris',  icon: <Boxes className="w-4 h-4" />,        roles: ['guru', 'admin'] },
        ],
    },
    {
        label: 'Master Data',
        roles: ['admin'],
        items: [
            { to: '/dashboard/users',          label: 'Pengguna',    icon: <Users className="w-4 h-4" />,       roles: ['admin'] },
            { to: '/dashboard/classes',         label: 'Kelas',       icon: <GraduationCap className="w-4 h-4" />,roles: ['admin'] },
            { to: '/dashboard/academic-years',  label: 'Tahun Ajaran',icon: <CalendarDays className="w-4 h-4" />, roles: ['admin'] },
        ],
    },
    {
        label: 'Akun',
        items: [
            { to: '/dashboard/profile', label: 'Profil Saya',      icon: <UserCircle className="w-4 h-4" /> },
            { to: '/dashboard/guide',   label: 'Panduan Pengguna', icon: <BookOpen className="w-4 h-4" /> },
        ],
    },
];

// ─── Sidebar NavItem ──────────────────────────────────────────────────────────

function SideNavItem({ item, onClose }: { item: NavItem; onClose?: () => void }) {
    return (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`
            }
        >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </NavLink>
    );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ role, onClose }: { role: string; onClose?: () => void }) {
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-4 py-5 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <img src="/tkj.svg" alt="TKJ" className="w-5 h-5 object-contain" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-none">Inventory TKJ</p>
                        <p className="text-xs text-neutral-400 mt-0.5 capitalize">{role}</p>
                    </div>
                </div>
            </div>

            {/* Nav groups */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV_GROUPS.map(group => {
                    // filter group berdasarkan role
                    if (group.roles && !group.roles.includes(role)) return null;

                    const visibleItems = group.items.filter(
                        item => !item.roles || item.roles.includes(role)
                    );
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.label}>
                            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
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

            {/* User profile + logout */}
            <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    {user?.avatar && user.avatar_type === 'upload' ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                    ) : user ? (
                        <GeneratedAvatar name={user.name} email={user.email} size={32} />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{user?.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar
                </button>
            </div>
        </div>
    );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function DashboardLayout() {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const user = useAuthStore(state => state.user);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const role = user?.role ?? 'siswa';

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex overflow-x-hidden">

            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 fixed inset-y-0 left-0 z-30">
                <SidebarContent role={role} />
            </aside>

            {/* ── Mobile sidebar overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Mobile sidebar drawer ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-200 lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        aria-label="Tutup menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <SidebarContent role={role} onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* ── Main content area ── */}
            <div className="flex-1 min-w-0 flex flex-col lg:pl-60">

                {/* Mobile topbar */}
                <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        aria-label="Buka menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                            <img src="/tkj.svg" alt="TKJ" className="w-4 h-4 object-contain" />
                        </div>
                        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Inventory TKJ</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-5 md:p-7 min-w-0 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
