import api from '@/lib/axios';

export const loginWithGoogle = async (token: string) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
};

export const logout = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};
