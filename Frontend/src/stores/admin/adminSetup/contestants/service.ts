import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  AddContestantInput,
  AddContestantResponse,
  DeleteContestantInput,
  DeleteContestantResponse,
  GetAllContestantsParams,
  GetAllContestantsResponse,
} from '@/types/admin/adminSetup/contestants/contestants';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const contestantService = {
  getContestants: async (params?: GetAllContestantsParams) => {
    const res = await axiosInstance.get('/contestants', { params });
    return GetTypeResponse<GetAllContestantsResponse>(res);
  },

  addContestant: async (contestantInput: AddContestantInput) => {
    const res = await axiosInstance.post('/contestants', contestantInput);
    return GetTypeResponse<AddContestantResponse>(res);
  },

  deleteContestant: async (deleteContestantId: number) => {
    const res = await axiosInstance.delete(`/contestants/${deleteContestantId}`);
    return GetTypeResponse<DeleteContestantResponse>(res);
  },
};
