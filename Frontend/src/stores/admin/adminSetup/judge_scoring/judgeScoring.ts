import {
  type GetRoundContestantsDTO,
  type GetCategoryScoringFieldsDTO,
  type GetJudgeRoundsDTO,
  type GetMyCategoryScoresDTO,
  type SubmitCategoryScoreEntry,
} from '@/types/admin/adminSetup/judge_scoring/judgeScoring';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { judgeScoringService } from './service';
import { useToast } from '@/composables/Toast/useToast';
import { errorHandler } from '@/api/errors/errorHandler';
import { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';

import type { JudgeScoringErrorCodes } from '@/types/admin/adminSetup/judge_scoring/error';

export const useJudgeScoringStore = defineStore('judgeScoringStore', () => {
  const { toast } = useToast();
  const judgeScoringRoundList = ref<GetJudgeRoundsDTO[]>([]);
  const categoryFieldsList = ref<GetCategoryScoringFieldsDTO | null>(null);
  const contestantsList = ref<GetRoundContestantsDTO[]>([]);
  const categoryScoresList = ref<GetMyCategoryScoresDTO | null>(null);
  const formScores = ref<Record<number, Record<number, string>>>({});

  const loadingStates = reactive({
    isSubmittingCategoryScores: false,
    isFetchingRounds: false,
    isFetchingCategoryFields: false,
    isFetchingContestants: false,
    iFetchingCategoryScores: false,
  });

  const errorStates = reactive({
    isFetchingRoundsError: false,
    isFetchingCategoryFieldsError: false,
    isFetchingContestantsError: false,
    isFetchingCategoryScoresError: false,
  });

  const initializeFormScores = () => {
    const newScores: Record<number, Record<number, string>> = {};
    const contestants = contestantsList.value;
    const fields = categoryFieldsList.value?.fields || [];
    const existingScores = categoryScoresList.value?.scores || [];

    contestants.forEach((con) => {
      const contestantScores: Record<number, string> = {};

      fields.forEach((f) => {
        const foundScore = existingScores.find(
          (s) => s.contestantId === con.id && s.criteriaFieldId === f.id,
        );
        contestantScores[f.id] = foundScore ? String(foundScore.value) : '';
      });
      newScores[con.id] = contestantScores;
    });

    formScores.value = newScores;
  };

  const getJudgeScoringRounds = async () => {
    if (loadingStates.isFetchingRounds) {
      return;
    }
    loadingStates.isFetchingRounds = true;
    try {
      const res = await judgeScoringService.getJudgeRounds();
      judgeScoringRoundList.value = res.data;

      errorStates.isFetchingRoundsError = false;
    } catch (error) {
      const { type, code, message } = errorHandler<JudgeScoringErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeScoringErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingRoundsError = true;
      }

      if (code === 'SCORING_ROUNDS_GET_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingRounds = false;
    }
  };

  const getCategoryFields = async (id: number) => {
    if (loadingStates.isFetchingCategoryFields) {
      return;
    }
    loadingStates.isFetchingCategoryFields = true;
    try {
      const res = await judgeScoringService.getCategoryFields(id);
      categoryFieldsList.value = res.data;
      errorStates.isFetchingCategoryFieldsError = false;
    } catch (error) {
      const { type, code, message } = errorHandler<JudgeScoringErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeScoringErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingCategoryFieldsError = true;
      }

      if (code === 'SCORING_FIELDS_GET_ERROR') {
        toast.error(message);
      } else if (code === 'SCORING_CATEGORY_ID_INVALID') {
        toast.warning(message);
      } else if (code === 'SCORING_CATEGORY_NOT_FOUND') {
        toast.warning(message);
      }
    } finally {
      loadingStates.isFetchingCategoryFields = false;
    }
  };

  const getRoundContestants = async (id: number) => {
    if (loadingStates.isFetchingContestants) {
      return;
    }
    loadingStates.isFetchingContestants = true;
    try {
      const res = await judgeScoringService.getRoundContestants(id);
      contestantsList.value = res.data;
      errorStates.isFetchingContestantsError = false;
    } catch (error) {
      const { type, code, message } = errorHandler<JudgeScoringErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeScoringErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingContestantsError = true;
      }

      if (code === 'SCORING_ROUND_ID_INVALID') {
        toast.warning(message);
      } else if (code === 'SCORING_ROUND_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'SCORING_CONTESTANTS_GET_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingContestants = false;
    }
  };

  const getCategoryScores = async (id: number) => {
    if (loadingStates.iFetchingCategoryScores) {
      return;
    }
    loadingStates.iFetchingCategoryScores = true;
    try {
      const res = await judgeScoringService.getCategoryScores(id);
      categoryScoresList.value = res.data;
      errorStates.isFetchingCategoryScoresError = false;
    } catch (error) {
      const { type, code, message } = errorHandler<JudgeScoringErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeScoringErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingCategoryScoresError = true;
      }

      if (code === 'SCORING_CATEGORY_ID_INVALID') {
        toast.warning(message);
      } else if (code === 'SCORING_CATEGORY_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'SCORING_SCORES_GET_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.iFetchingCategoryScores = false;
    }
  };

  const submitCategoryScores = async (id: number): Promise<boolean> => {
    if (loadingStates.isSubmittingCategoryScores) {
      return false;
    }

    const payload: SubmitCategoryScoreEntry[] = [];
    const fields = categoryFieldsList.value?.fields || [];
    for (const con of contestantsList.value) {
      for (const f of fields) {
        const val = formScores.value[con.id]?.[f.id];

        if (val === undefined || val === null || String(val).trim() === '') {
          toast.warning(`Please enter a score for ${con.name} in ${f.name}.`);
          return false;
        }

        const numVal = parseFloat(String(val));

        if (isNaN(numVal) || numVal < 1 || numVal > f.maxValue) {
          toast.warning(`Score for ${con.name} in ${f.name} must be between 1 and ${f.maxValue}.`);
          return false;
        }

        payload.push({
          contestantId: con.id,
          criteriaFieldId: f.id,
          value: numVal.toFixed(2),
        });
      }
    }

    loadingStates.isSubmittingCategoryScores = true;
    try {
      const res = await judgeScoringService.submitCategoryScores(id, payload);
      toast.success(res.message);
      if (categoryScoresList.value) {
        categoryScoresList.value.isSubmitted = true;
      }
      return true;
    } catch (error) {
      const { type, code, message } = errorHandler<JudgeScoringErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeScoringErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'SCORING_CATEGORY_ID_INVALID') {
        toast.warning(message);
      } else if (code === 'SCORING_CATEGORY_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'SCORING_SCORES_REQUIRED') {
        toast.warning(message);
      } else if (code === 'SCORING_SCORE_ENTRY_INVALID') {
        toast.warning(message);
      } else if (code === 'SCORING_VALUE_INVALID') {
        toast.warning(message);
      } else if (code === 'SCORING_DUPLICATE_ENTRY') {
        toast.warning(message);
      } else if (code === 'SCORING_CATEGORY_NO_FIELDS') {
        toast.warning(message);
      } else if (code === 'SCORING_ROUND_NO_CONTESTANTS') {
        toast.warning(message);
      } else if (code === 'SCORING_CONTESTANT_NOT_IN_ROUND') {
        toast.warning(message);
      } else if (code === 'SCORING_FIELD_NOT_IN_CATEGORY') {
        toast.warning(message);
      } else if (code === 'SCORING_SCORES_INCOMPLETE') {
        toast.warning(message);
      } else if (code === 'SCORING_VALUE_OUT_OF_RANGE') {
        toast.warning(message);
      } else if (code === 'SCORING_ALREADY_SUBMITTED') {
        toast.warning(message);
      } else if (code === 'SCORING_ROUND_LOCKED') {
        toast.warning(message);
      } else if (code === 'SCORING_ROUND_COMPLETED') {
        toast.warning(message);
      } else if (code === 'SCORING_SUBMIT_ERROR') {
        toast.error(message);
      }
      return false;
    } finally {
      loadingStates.isSubmittingCategoryScores = false;
    }
  };
  return {
    submitCategoryScores,
    getCategoryScores,
    getRoundContestants,
    getCategoryFields,
    getJudgeScoringRounds,
    initializeFormScores,
    contestantsList,
    categoryScoresList,
    categoryFieldsList,
    judgeScoringRoundList,
    formScores,
    loadingStates,
    errorStates,
  };
});
