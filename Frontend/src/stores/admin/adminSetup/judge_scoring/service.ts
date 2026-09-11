import { axiosInstance } from '@/api/axios/axiosConfig';
import type {
  GetRoundContestantsResponse,
  GetCategoryScoringFieldsResponse,
  GetJudgeRoundsResponse,
  GetMyCategoryScoresResponse,
  SubmitCategoryScoresResponse,
  SubmitCategoryScoreEntry,
} from '@/types/admin/adminSetup/judge_scoring/judgeScoring';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const judgeScoringService = {
  getJudgeRounds: async () => {
    const res = await axiosInstance.get('/judge-scoring/rounds');
    return GetTypeResponse<GetJudgeRoundsResponse>(res);
  },

  getCategoryFields: async (id: number) => {
    const res = await axiosInstance.get(`/judge-scoring/categories/${id}/fields`);
    return GetTypeResponse<GetCategoryScoringFieldsResponse>(res);
  },

  getRoundContestants: async (id: number) => {
    const res = await axiosInstance.get(`/judge-scoring/rounds/${id}/contestants`);
    return GetTypeResponse<GetRoundContestantsResponse>(res);
  },

  getCategoryScores: async (id: number) => {
    const res = await axiosInstance.get(`/judge-scoring/categories/${id}/scores`);
    return GetTypeResponse<GetMyCategoryScoresResponse>(res);
  },

  submitCategoryScores: async (id: number, scores: SubmitCategoryScoreEntry[]) => {
    const res = await axiosInstance.post(`/judge-scoring/categories/${id}/scores`, { scores });
    return GetTypeResponse<SubmitCategoryScoresResponse>(res);
  },
};
