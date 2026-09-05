import { defineStore } from 'pinia';
import { computed, watch, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRoundStore } from '../adminSetup/rounds/roundStore';
import { liveService } from './service';
import { useToast } from '@/composables/Toast/useToast';
import type { GetRoundResultsDTO, GetJudgeSubmissionsDTO } from '@/types/admin/adminLive/live';
import type { liveErrorCodes } from '@/types/admin/adminLive/error';
import type { ErrorResponse } from '@/api/errors';
import { errorHandler } from '@/api/errors/errorHandler';
import type { AxiosError } from 'axios';

export const useLiveStore = defineStore('liveStore', () => {
  const { toast } = useToast();
  const route = useRoute();
  const roundStore = useRoundStore();
  const judgeList = ref<GetJudgeSubmissionsDTO | null>(null);
  const roundResult = ref<GetRoundResultsDTO | null>(null);

  const loadingStates = reactive({
    isFetchingJudgeSubmissions: false,
    isFetchingRoundResults: false,
  });

  const errorStates = reactive({
    isFetchingJudgeSubmissionsError: false,
    isFetchingRoundResultsError: false,
  });

  const getJudgeSubmissionsId = async (id: number) => {
    if (loadingStates.isFetchingJudgeSubmissions) {
      return;
    }
    loadingStates.isFetchingJudgeSubmissions = true;
    try {
      const res = await liveService.getJudgeSubmissions(id);
      judgeList.value = res.data;
      errorStates.isFetchingJudgeSubmissionsError = false;
    } catch (error) {
      const { type, code, message } = errorHandler<liveErrorCodes>(
        error as AxiosError<ErrorResponse<liveErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingJudgeSubmissionsError = true;
      }
      if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'JUDGE_SUBMISSIONS_GET_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingJudgeSubmissions = false;
    }
  };

  const getRoundResults = async (id: number) => {
    if (loadingStates.isFetchingRoundResults) {
      return;
    }
    loadingStates.isFetchingRoundResults = true;
    try {
      const res = await liveService.getRoundResults(id);
      roundResult.value = res.data;
      errorStates.isFetchingRoundResultsError = false;
    } catch (error) {
      const { type, code, message } = errorHandler<liveErrorCodes>(
        error as AxiosError<ErrorResponse<liveErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingJudgeSubmissionsError = true;
      }

      if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'ROUND_RESULTS_GET_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingRoundResults = false;
    }
  };

  return {
    getRoundResults,
    roundResult,
    getJudgeSubmissionsId,
    judgeList,
    loadingStates,
    errorStates,
  };
});
