import { defineStore } from 'pinia';
import { computed, watch, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRoundStore } from '../adminSetup/rounds/roundStore';
import { liveService } from './service';
import { useToast } from '@/composables/Toast/useToast';
import type {
  GetRoundResultsDTO,
  GetJudgeSubmissionsDTO,
  GetDeclaredWinnersDTO,
} from '@/types/admin/adminLive/live';
import type { liveErrorCodes } from '@/types/admin/adminLive/error';
import type { ErrorResponse } from '@/api/errors';
import { errorHandler } from '@/api/errors/errorHandler';
import type { AxiosError } from 'axios';

export const useLiveStore = defineStore('liveStore', () => {
  const { toast } = useToast();
  const selectedContestantIds = ref<number[]>([]);
  const judgeList = ref<GetJudgeSubmissionsDTO | null>(null);
  const roundResult = ref<GetRoundResultsDTO | null>(null);
  const declaredWinners = ref<GetDeclaredWinnersDTO | null>(null);

  const isTieResolved = computed(() => {
    const hasTie = roundResult.value?.advancement.hasTie ?? false;
    if (!hasTie) {
      return true;
    }

    const required = roundResult.value?.advancement.requiredSelections ?? 0;
    return selectedContestantIds.value.length === required;
  });

  const loadingStates = reactive({
    isAddingAdvanceRound: false,
    isAddingDeclaredWinners: false,
    isFetchingJudgeSubmissions: false,
    isFetchingRoundResults: false,
    isFetchingDeclaredWinners: false,
  });

  const errorStates = reactive({
    isFetchingJudgeSubmissionsError: false,
    isFetchingRoundResultsError: false,
    isFetchingDeclaredWinnersError: false,
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
      selectedContestantIds.value = [];
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

  const getDeclaredWinners = async (id: number) => {
    if (loadingStates.isFetchingDeclaredWinners) {
      return;
    }
    loadingStates.isFetchingDeclaredWinners = true;
    try {
      const res = await liveService.getDeclaredWinners(id);
      declaredWinners.value = res.data;
      errorStates.isFetchingDeclaredWinnersError = false;
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
        errorStates.isFetchingDeclaredWinnersError = true;
      }

      if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'DECLARED_WINNERS_GET_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingDeclaredWinners = false;
    }
  };

  const addAdvanceRound = async (id: number): Promise<boolean> => {
    if (loadingStates.isAddingAdvanceRound) {
      return false;
    }
    loadingStates.isAddingAdvanceRound = true;
    try {
      const payload = roundResult.value?.advancement.hasTie
        ? { selectedContestantIds: selectedContestantIds.value }
        : undefined;

      const res = await liveService.addAdvanceRound(id, payload);
      toast.success(res.message);
      return true;
    } catch (error) {
      const { type, code, message } = errorHandler<liveErrorCodes>(
        error as AxiosError<ErrorResponse<liveErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_INVALID') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_ID_INVALID') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_DUPLICATE') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_NOT_ALLOWED') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_REQUIRED') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_COUNT_INVALID') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP') {
        toast.warning(message);
      } else if (code === 'ADVANCE_CONTESTANT_COUNT_MISMATCH') {
        toast.warning(message);
      } else if (code === 'FORBIDDEN') {
        toast.error(message);
      } else if (code === 'ADVANCE_NOT_ALLOWED') {
        toast.warning(message);
      } else if (code === 'ROUND_ADVANCEMENT_ERROR') {
        toast.error(message);
      }

      return false;
    } finally {
      loadingStates.isAddingAdvanceRound = false;
    }
  };

  const addDeclareWinners = async (id: number): Promise<boolean> => {
    if (loadingStates.isAddingDeclaredWinners) {
      return false;
    }
    loadingStates.isAddingDeclaredWinners = true;

    try {
      const payload = roundResult.value?.advancement.hasTie
        ? { selectedContestantIds: selectedContestantIds.value }
        : undefined;

      const res = await liveService.declareWinners(id, payload);
      toast.success(res.message);
      return true;
    } catch (error) {
      const { type, code, message } = errorHandler<liveErrorCodes>(
        error as AxiosError<ErrorResponse<liveErrorCodes>>,
      );

      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      } else if (['server_error', 'timeout', 'unreachable'].includes(type)) {
        toast.error(message, { title: 'Server Error' });
      } else if (code === 'ROUND_ID_INVALID') {
        toast.warning(message, { title: 'Invalid Round ID' });
      } else if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Phase Not Found' });
      } else if (code === 'SELECTED_CONTESTANT_IDS_INVALID') {
        toast.warning(message, { title: 'Invalid Selection' });
      } else if (code === 'SELECTED_CONTESTANT_ID_INVALID') {
        toast.warning(message, { title: 'Invalid Contestant' });
      } else if (code === 'SELECTED_CONTESTANT_IDS_DUPLICATE') {
        toast.warning(message, { title: 'Duplicate Contestants' });
      } else if (code === 'SELECTED_CONTESTANT_IDS_NOT_ALLOWED') {
        toast.warning(message, { title: 'Selection Not Allowed' });
      } else if (code === 'SELECTED_CONTESTANT_IDS_REQUIRED') {
        toast.warning(message, { title: 'Selection Required' });
      } else if (code === 'SELECTED_CONTESTANT_IDS_COUNT_INVALID') {
        toast.warning(message, { title: 'Invalid Count' });
      } else if (code === 'SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP') {
        toast.warning(message, { title: 'Not In Tie Group' });
      } else if (code === 'DECLARE_WINNER_COUNT_MISMATCH') {
        toast.warning(message, { title: 'Count Mismatch' });
      } else if (code === 'DECLARE_NOT_ALLOWED') {
        toast.warning(message, { title: 'Declaration Not Allowed' });
      } else if (code === 'FORBIDDEN') {
        toast.error(message, { title: 'Access Denied' });
      } else if (code === 'DECLARE_WINNERS_ERROR') {
        toast.error(message, { title: 'Declare Winners Error' });
      }

      return false;
    } finally {
      loadingStates.isAddingDeclaredWinners = false;
    }
  };

  return {
    addDeclareWinners,
    isTieResolved,
    selectedContestantIds,
    addAdvanceRound,
    getDeclaredWinners,
    declaredWinners,
    getRoundResults,
    roundResult,
    getJudgeSubmissionsId,
    judgeList,
    loadingStates,
    errorStates,
  };
});
