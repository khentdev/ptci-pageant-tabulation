import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  GetAllContestantsParams,
  GetAllContestantsResponse,
} from '@/types/admin/adminSetup/contestants/contestants';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const contestantService = {
  getContestants: async (params?: GetAllContestantsParams) => {
  
    const res = await axiosInstance.get('/contestants', { params });
    return GetTypeResponse<GetAllContestantsResponse>(res);
  },
};
