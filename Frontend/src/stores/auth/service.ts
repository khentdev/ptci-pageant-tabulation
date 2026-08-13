import type { loginInput, loginResponse, user } from '@/types/auth/userAuth';
import { axiosInstance } from '@/api/axios/axiosConfig';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const authService = {
  loginUser: async (user: loginInput) => {
    const res = await axiosInstance.post('/auth/login', user);
    return GetTypeResponse<loginResponse>(res);
  },

  getMe: async () => {
    const res = await axiosInstance.get('/session/me');
    return GetTypeResponse<user>(res);
  },

  logoutUser: async () => {
    const res = await axiosInstance.delete('/session/logout');
    return GetTypeResponse<loginResponse>(res);
  },
};
