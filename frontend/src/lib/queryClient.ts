import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0,                  // data langsung stale, refetch saat dibutuhkan
            gcTime: 1000 * 60 * 5,         // cache disimpan 5 menit di memori
            retry: 1,
            refetchOnWindowFocus: true,    // refetch saat user kembali ke tab
            refetchOnReconnect: true,      // refetch saat koneksi kembali
        },
        mutations: {
            onError: (error: any) => {
                const message = error.response?.data?.message || error.message || 'Terjadi kesalahan';
                toast.error(message);
            },
        },
    },
});
