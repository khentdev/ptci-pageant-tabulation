import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
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
  const placementOrder = ref<number[]>([]);
  const judgeList = ref<GetJudgeSubmissionsDTO | null>(null);
  const roundResult = ref<GetRoundResultsDTO | null>(null);
  const declaredWinners = ref<GetDeclaredWinnersDTO | null>(null);

  const isTieResolved = computed(() => {
    const hasTie = roundResult.value?.advancement.hasTie;
    if (!hasTie) {
      return true;
    }

    const required = roundResult.value?.advancement.requiredSelections;
    return selectedContestantIds.value.length === required;
  });

  const isPlacementOrderResolved = computed(() => {
    const clusters = roundResult.value?.placementTies;
    if (!clusters || clusters.length === 0) {
      return true;
    }

    return clusters.every((cluster) =>
      cluster.contestants.every((contestant) => placementOrder.value.includes(contestant.id)),
    );
  });

  const loadingStates = reactive({
    isAddingAdvanceRound: false,
    isAddingDeclaredWinners: false,
    isFetchingJudgeSubmissions: false,
    isFetchingRoundResults: false,
    isFetchingDeclaredWinners: false,
  });

  const errorStates = reactive({
    isFetchingRoundPhaseNotFound: false,
    isFetchingJudgeSubmissionsError: false,
    isFetchingRoundResultsError: false,
    isFetchingDeclaredWinnersError: false,
  });

  const isLiveEventNotFound = computed(() => errorStates.isFetchingRoundPhaseNotFound);
  const isLiveEventServerError = computed(() => errorStates.isFetchingJudgeSubmissionsError || errorStates.isFetchingRoundResultsError || errorStates.isFetchingDeclaredWinnersError);
  const isFetchingLiveEvent = computed(() => loadingStates.isFetchingJudgeSubmissions || loadingStates.isFetchingRoundResults || loadingStates.isFetchingDeclaredWinners);

  const getJudgeSubmissionsById = async (id: number) => {
    if (loadingStates.isFetchingJudgeSubmissions) {
      return;
    }
    loadingStates.isFetchingJudgeSubmissions = true;
    try {
      const res = await liveService.getJudgeSubmissions(id);
      judgeList.value = res.data;
      errorStates.isFetchingJudgeSubmissionsError = false;
      errorStates.isFetchingRoundPhaseNotFound = false;
    } catch (error) {
      const { type, code } = errorHandler<liveErrorCodes>(
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
        errorStates.isFetchingRoundPhaseNotFound = true;
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
      placementOrder.value = [];
      errorStates.isFetchingRoundResultsError = false;
      errorStates.isFetchingRoundPhaseNotFound = false;
    } catch (error) {
      const { type, code } = errorHandler<liveErrorCodes>(
        error as AxiosError<ErrorResponse<liveErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingRoundResultsError = true;
      }
      if (code === 'ROUND_PHASE_NOT_FOUND') {
        errorStates.isFetchingRoundPhaseNotFound = true;
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
      errorStates.isFetchingRoundPhaseNotFound = false;
    } catch (error) {
      const { type, code } = errorHandler<liveErrorCodes>(
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
        errorStates.isFetchingRoundPhaseNotFound = true;
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
        toast.warning(message, { title: 'Phase Not Found' });
      } else if (code === 'SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_INVALID') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_DUPLICATE') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_REQUIRED') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_COUNT_INVALID') {
        toast.warning(message);
      } else if (code === 'ADVANCE_CONTESTANT_COUNT_MISMATCH') {
        toast.warning(message);
      } else if (code === 'FORBIDDEN') {
        toast.error(message);
      } else if (code === 'ADVANCE_NOT_ALLOWED') {
        toast.warning(message);
      } else if (code === 'ADVANCE_REQUIRES_CHAIRMAN') {
        toast.warning(message, { title: 'Chairman Required' });
      } else if (code === 'CHAIRMAN_ACTION_REQUIRES_TIE') {
        toast.warning(message, { title: 'No Tie To Resolve' });
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
      const payload: { selectedContestantIds?: number[]; placementOrder?: number[] } = {};
      if (roundResult.value?.advancement.hasTie) {
        payload.selectedContestantIds = selectedContestantIds.value;
      }
      if (roundResult.value?.placementTies?.length) {
        payload.placementOrder = placementOrder.value;
      }

      const res = await liveService.declareWinners(
        id,
        Object.keys(payload).length > 0 ? payload : undefined,
      );
      toast.success(res.message);
      return true;
    } catch (error) {
      const { type, code, message } = errorHandler<liveErrorCodes>(
        error as AxiosError<ErrorResponse<liveErrorCodes>>,
      );

      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      } if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      } else if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Phase Not Found' });
      } else if (code === 'SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP') {
        toast.warning(message, { title: 'Not In Tie Group' });
      } else if (code === 'SELECTED_CONTESTANT_IDS_INVALID') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_DUPLICATE') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_REQUIRED') {
        toast.warning(message);
      } else if (code === 'SELECTED_CONTESTANT_IDS_COUNT_INVALID') {
        toast.warning(message);
      } else if (code === 'PLACEMENT_ORDER_REQUIRED') {
        toast.warning(message, { title: 'Placement Order Required' });
      } else if (code === 'PLACEMENT_ORDER_MISMATCH') {
        toast.warning(message, { title: 'Placement Order Mismatch' });
      } else if (code === 'PLACEMENT_ORDER_NOT_ALLOWED') {
        toast.warning(message);
      } else if (code === 'PLACEMENT_ORDER_INVALID') {
        toast.warning(message);
      } else if (code === 'PLACEMENT_ORDER_ID_INVALID') {
        toast.warning(message);
      } else if (code === 'PLACEMENT_ORDER_IDS_DUPLICATE') {
        toast.warning(message);
      } else if (code === 'DECLARE_WINNER_COUNT_MISMATCH') {
        toast.warning(message, { title: 'Count Mismatch' });
      } else if (code === 'DECLARE_NOT_ALLOWED') {
        toast.warning(message, { title: 'Declaration Not Allowed' });
      } else if (code === 'DECLARE_REQUIRES_CHAIRMAN') {
        toast.warning(message, { title: 'Chairman Required' });
      } else if (code === 'CHAIRMAN_ACTION_REQUIRES_TIE') {
        toast.warning(message, { title: 'No Tie To Resolve' });
      } else if (code === 'FORBIDDEN') {
        toast.error(message, { title: 'Access Denied' });
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
    placementOrder,
    isPlacementOrderResolved,
    addAdvanceRound,
    isLiveEventNotFound,
    getDeclaredWinners,
    declaredWinners,
    isLiveEventServerError,
    getRoundResults,
    roundResult,
    isFetchingLiveEvent,
    getJudgeSubmissionsById,
    judgeList,
    loadingStates,
    errorStates,
  };
});
