import { axiosInstance } from '@/api/axios/axiosConfig';
import {
  type AddRoundResponse,
  type AddRoundInput,
  type GetRoundsListResponse,
  type GetRoundByIdResponse,
  type EditRoundInput,
  type EditRoundResponse,
  type DeleteRoundPhaseInput,
  type DeleteRoundPhaseResponse,
} from '@/types/admin/adminSetup/rounds/rounds';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const roundService = {
  addRound: async (addRoundInput: AddRoundInput) => {
    const res = await axiosInstance.post('/rounds', addRoundInput);
    return GetTypeResponse<AddRoundResponse>(res);
  },

  getRound: async () => {
    const res = await axiosInstance.get('/rounds');
    return GetTypeResponse<GetRoundsListResponse>(res);
  },

  getRoundId: async (id: number) => {
    const res = await axiosInstance.get(`/rounds/${id}`);
    return GetTypeResponse<GetRoundByIdResponse>(res);
  },

  editRound: async (editRoundInput: EditRoundInput) => {
    const { id, name, contestantLimit } = editRoundInput;
    const res = await axiosInstance.patch(`/rounds/${id}`, { name, contestantLimit });
    return GetTypeResponse<EditRoundResponse>(res);
  },

  deleteRound: async ({ id }: DeleteRoundPhaseInput) => {
    const res = await axiosInstance.delete(`/rounds/${id}`);
    return GetTypeResponse<DeleteRoundPhaseResponse>(res);
  },
};
