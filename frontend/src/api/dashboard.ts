import api from '@/lib/axios';

// --- Types ---

export interface DashboardStats {
    total_items: number;
    total_categories: number;
    total_users: number;
    active_borrowings: number;
    pending_approvals: number;
    items_low_stock: number;
    returning_count: number;
}

export interface RecentBorrowing {
    id: number;
    code: string;
    user?: { name: string };
    status: string;
    items_count: number;
    borrow_date?: string;
    expected_return_date?: string;
    created_at: string;
}

export interface RecentActivity {
    action: string;
    description: string;
    user?: { name: string };
    created_at: string;
}

export interface ChartData {
    date: string;
    count: number;
}

export interface DashboardData {
    stats: DashboardStats;
    recent_borrowings: RecentBorrowing[];
    recent_activity: RecentActivity[];
    borrowings_chart: ChartData[];
}

// --- API call ---

export const getDashboard = async (): Promise<DashboardData> => {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return response.data.data;
};
