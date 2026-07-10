import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';

import { router } from '@/routes';
import { queryClient } from '@/lib/queryClient';
import ThemeProvider from '@/providers/ThemeProvider';
import './index.css';

// TODO: Replace with env variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1013444632832-example.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={router} />
                    <Toaster richColors position="top-right" />
                </QueryClientProvider>
            </GoogleOAuthProvider>
        </ThemeProvider>
    </StrictMode>
);
