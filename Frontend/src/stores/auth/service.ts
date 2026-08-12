import type { loginInput, loginResponse } from '@/types/auth/userAuth';
import { axiosInstance } from '@/api/axios/axiosConfig';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const authService = {
  loginUser: async (user: loginInput) => {
    const res = await axiosInstance.post('/auth/login', user);
    return GetTypeResponse<loginResponse>(res);
  },
};
    