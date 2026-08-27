import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  AddContestantInput,
  AddContestantResponse,
  DeleteContestantInput,
  DeleteContestantResponse,
  EditContestantInput,
  EditContestantResponse,
  GetAllContestantsParams,
  GetAllContestantsResponse,
  GetContestantByIdInput,
  GetContestantByIdResponse,
} from '@/types/admin/adminSetup/contestants/contestants';
import axios from 'axios';

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

  editContestant: async (editContestantInput: EditContestantInput) => {
    const res = await axiosInstance.patch(
      `/contestants/${editContestantInput.id}`,
      editContestantInput,
    );
    return GetTypeResponse<EditContestantResponse>(res);
  },

  getContestantsId: async (contestantIdInput: number) => {
    const res = await axiosInstance.get(`/contestants/${contestantIdInput}`);
    return GetTypeResponse<GetContestantByIdResponse>(res);
  },

  deleteContestant: async (deleteContestantId: number) => {
    const res = await axiosInstance.delete(`/contestants/${deleteContestantId}`);
    return GetTypeResponse<DeleteContestantResponse>(res);
  },
};
