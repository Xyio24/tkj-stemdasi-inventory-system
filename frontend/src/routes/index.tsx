import { createBrowserRouter, Navigate } from 'react-router-dom';
import GuestLayout from '@/layouts/GuestLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';

import UserList from '@/pages/users/UserList';
import AcademicYearList from '@/pages/master/AcademicYearList';
import ClassList from '@/pages/master/ClassList';
import CategoryList from '@/pages/inventory/CategoryList';
import ItemList from '@/pages/inventory/ItemList';
import ItemForm from '@/pages/inventory/ItemForm';
import BorrowingList from '@/pages/borrowing/BorrowingList';
import BorrowingForm from '@/pages/borrowing/BorrowingForm';
import BorrowingDetail from '@/pages/borrowing/BorrowingDetail';
import BorrowingReportPage from '@/pages/report/BorrowingReportPage';
import ReturnReportPage from '@/pages/report/ReturnReportPage';
import InventoryReportPage from '@/pages/report/InventoryReportPage';
import UserGuidePage from '@/pages/dashboard/UserGuidePage';
import ProfilePage from '@/pages/profile/ProfilePage';


export const router = createBrowserRouter([
    {
        path: '/',
        element: <GuestLayout />,
        children: [
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'register',
                element: <Register />,
            },
            {
                index: true,
                element: <Navigate to="/login" replace />,
            },
        ],
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'users',
                element: <UserList />,
            },
            {
                path: 'academic-years',
                element: <AcademicYearList />,
            },
            {
                path: 'classes',
                element: <ClassList />,
            },
            {
                path: 'categories',
                element: <CategoryList />,
            },
            {
                path: 'items',
                element: <ItemList />,
            },
            {
                path: 'items/create',
                element: <ItemForm />,
            },
            {
                path: 'items/:id/edit',
                element: <ItemForm />,
            },
            {
                path: 'borrowings',
                element: <BorrowingList />,
            },
            {
                path: 'borrowings/create',
                element: <BorrowingForm />,
            },
            {
                path: 'borrowings/:id',
                element: <BorrowingDetail />,
            },
            {
                path: 'reports/borrowings',
                element: <BorrowingReportPage />,
            },
            {
                path: 'reports/returns',
                element: <ReturnReportPage />,
            },
            {
                path: 'reports/inventory',
                element: <InventoryReportPage />,
            },
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'guide',
                element: <UserGuidePage />,
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
    },
]);
