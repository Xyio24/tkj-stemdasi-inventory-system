import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function GuestLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
