import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  DeclareWinnersResponse,
  AdvanceRoundResponse,
  GetDeclaredWinnersResponse,
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

  getDeclaredWinners: async (id: number) => {
    const res = await axiosInstance.get(`/live-event/round-results/${id}/declared-winners`);
    return GetTypeResponse<GetDeclaredWinnersResponse>(res);
  },

  addAdvanceRound: async (id: number, payload?: { selectedContestantIds?: number[] }) => {
    const res = await axiosInstance.post(`/live-event/round-results/${id}/advancement`, payload);
    return GetTypeResponse<AdvanceRoundResponse>(res);
  },

  declareWinners: async (id: number, payload?: { selectedContestantIds?: number[] }) => {
    const res = await axiosInstance.post(
      `/live-event/round-results/${id}/declare-winners`,
      payload,
    );
    return GetTypeResponse<DeclareWinnersResponse>(res);
  },
};
