import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function GuestLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="relative min-h-dvh bg-mesh overflow-hidden">
            {/* ── Animated blobs (iOS gradient orbs) ── */}
            <div
                className="blob w-[600px] h-[600px] -top-32 -left-32 opacity-60"
                style={{ background: 'radial-gradient(circle, oklch(0.75 0.12 264) 0%, transparent 70%)' }}
            />
            <div
                className="blob w-[500px] h-[500px] top-1/3 -right-48 opacity-40"
                style={{
                    background: 'radial-gradient(circle, oklch(0.72 0.14 290) 0%, transparent 70%)',
                    animationDelay: '-4s',
                }}
            />
            <div
                className="blob w-[400px] h-[400px] -bottom-24 left-1/3 opacity-35"
                style={{
                    background: 'radial-gradient(circle, oklch(0.80 0.10 230) 0%, transparent 70%)',
                    animationDelay: '-8s',
                }}
            />

            {/* ── Content ── */}
            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
}
