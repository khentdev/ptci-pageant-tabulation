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

<<<<<<<< HEAD:Frontend/src/stores/admin/adminSetup/round/service.ts
  deleteRound: async (id: number) => {
========
  deleteRound: async ({ id }: DeleteRoundPhaseInput) => {
>>>>>>>> d807c4d3479698ae07c3cc4dbd0a88bb0d8f4953:Frontend/src/stores/admin/adminSetup/rounds/service.ts
    const res = await axiosInstance.delete(`/rounds/${id}`);
    return GetTypeResponse<DeleteRoundPhaseResponse>(res);
  },
};
