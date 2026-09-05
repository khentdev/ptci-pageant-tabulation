import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  GetJudgeSubmissionsResponse,
  GetRoundResultsResponse,
} from '@/types/admin/adminLive/live';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const liveService = {
  getJudgeSubmissions: async (id: number) => {
    const res = await axiosInstance.get(`/live-event/round-results/${id}`);
    return GetTypeResponse<GetJudgeSubmissionsResponse>(res);
  },

  getRoundResults: async (id: number) => {
    const res = await axiosInstance.get(`/live-event/round-results/${id}/advancement`);
    return GetTypeResponse<GetRoundResultsResponse>(res);
  },
};
