import api from '@/lib/axios';

export interface AcademicYear {
    id: number;
    name: string;
    is_active: boolean;
}

export interface StudentClass {
    id: number;
    academic_year_id: number;
    name: string;
    academic_year?: AcademicYear;
}

// Academic Years
export const getAcademicYears = async () => {
    const response = await api.get<{ success: boolean; data: AcademicYear[] }>('/academic-years');
    return response.data;
};

export const createAcademicYear = async (data: { name: string; is_active: boolean }) => {
    const response = await api.post('/academic-years', data);
    return response.data;
};

export const updateAcademicYear = async (id: number, data: { name?: string; is_active?: boolean }) => {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
};

export const deleteAcademicYear = async (id: number) => {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
};

// Classes
export const getClasses = async (params?: { academic_year_id?: number }) => {
    const response = await api.get<{ success: boolean; data: StudentClass[] }>('/classes', { params });
    return response.data;
};

export const createClass = async (data: { academic_year_id: number; name: string }) => {
    const response = await api.post('/classes', data);
    return response.data;
};

export const updateClass = async (id: number, data: { name: string }) => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
};

export const deleteClass = async (id: number) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
};
