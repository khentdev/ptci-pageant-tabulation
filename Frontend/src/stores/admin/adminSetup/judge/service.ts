import { axiosInstance } from '@/api/axios/axiosConfig';
import {
  type EditJudgeResponse,
  type AddJudgeInput,
  type AddJudgeResponse,
  type EditJudgeInput,
  type GetJudgeListResponse,
  type ResetJudgePasswordInput,
  type ResetJudgePasswordResponse,
  type DeleteJudgeResponse,
} from '@/types/admin/adminSetup/judge/judge';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const judgeService = {
  getJudgesList: async () => {
    const res = await axiosInstance.get('/judges');
    return GetTypeResponse<GetJudgeListResponse>(res);
  },

  addJudges: async (judgesInput: AddJudgeInput) => {
    const res = await axiosInstance.post('/judges', judgesInput);
    return GetTypeResponse<AddJudgeResponse>(res);
  },

  editJudges: async (judgesInput: EditJudgeInput) => {
    const res = await axiosInstance.patch(`/judges/${judgesInput.id}`, judgesInput);
    return GetTypeResponse<EditJudgeResponse>(res);
  },

  resetPassword: async (resetPasswordInput: ResetJudgePasswordInput) => {
    const res = await axiosInstance.patch(
      `/judges/${resetPasswordInput.id}/password`,
      resetPasswordInput,
    );
    return GetTypeResponse<ResetJudgePasswordResponse>(res);
  },

  deleteJudge: async (judgeId: number) => {
    const res = await axiosInstance.delete(`/judges/${judgeId}`);
    return GetTypeResponse<DeleteJudgeResponse>(res);
  },
};
