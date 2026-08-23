import { defineStore } from 'pinia';
import { roundService } from './service';
import {
  type GetRoundByIdDTO,
  type AddRoundInput,
  type GetRoundsListDTO,
  type EditRoundInput,
} from '@/types/admin/adminSetup/rounds/rounds';
import { reactive, ref } from 'vue';
import { errorHandler } from '@/api/errors/errorHandler';
import type { RoundErrorCodes } from '@/types/admin/adminSetup/rounds/error';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
import { useToast } from '@/composables/Toast/useToast';

const { toast } = useToast();

export const useRoundStore = defineStore('roundStore', () => {
  const roundList = ref<GetRoundsListDTO[]>([]);
  const roundId = ref<GetRoundByIdDTO | null>(null);

  const clearFormErrors = () => {
    formErrors.roundName = '';
    formErrors.roundPhase = '';
    formErrors.roundLimit = '';
  };

  const formErrors = reactive({
    roundName: '',
    roundPhase: '',
    roundLimit: '',
  });

  const loadingStates = reactive({
    isAddingRound: false,
    isEditingRound: false,
    isDeletingRound: false,
  });

  const addRound = async (addRoundInput: AddRoundInput): Promise<boolean> => {
    if (loadingStates.isAddingRound) {
      return false;
    }
    loadingStates.isAddingRound = true;
    try {
      const res = await roundService.addRound(addRoundInput);
      await getRound();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'ROUND_NAME_INVALID') {
        formErrors.roundName = message;
      } else if (code === 'ROUND_PHASE_ORDER_INVALID') {
        formErrors.roundPhase = message;
      } else if (code === 'ROUND_CONTESTANT_LIMIT_INVALID') {
        formErrors.roundLimit = message;
      } else if (code === 'ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS') {
        toast.warning(message, { title: 'No Preliminary Round' });
      } else if (code === 'ROUND_PHASE_ORDER_ALREADY_EXISTS') {
        toast.warning(message, { title: 'Phase Order Already Exists' });
      } else if (code === 'ROUND_PHASE_ORDER_DUPLICATE') {
        toast.warning(message, { title: 'Phase Order Duplicate' });
      } else if (code === 'ROUND_CONTESTANT_LIMIT_REQUIRED') {
        formErrors.roundLimit = message;
      }

      if (code === 'ROUND_PHASE_ADD_ERROR') {
        toast.error(message, { title: 'Error' });
      }

      return false;
    } finally {
      loadingStates.isAddingRound = false;
    }
  };

  const getRound = async () => {
    try {
      const res = await roundService.getRound();
      roundList.value = res.data;
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );

      if (code === 'ROUND_PHASE_GET_LIST_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const getRoundId = async (id: number) => {
    try {
      const res = await roundService.getRoundId(id);
      roundId.value = res.data;
      //toast.success(res.message,{title: 'Success'})
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );

      if (code === 'ROUND_PHASE_GET_BY_ID_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const editRound = async (editRoundInput: EditRoundInput): Promise<boolean> => {
    if (loadingStates.isEditingRound) {
      return false;
    }
    loadingStates.isEditingRound = true;
    try {
      const res = await roundService.editRound(editRoundInput);
      await getRound();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'ROUND_NAME_INVALID') {
        formErrors.roundName = message;
      } else if (code === 'ROUND_CONTESTANT_LIMIT_REQUIRED') {
        formErrors.roundLimit = message;
      } else if (code === 'ROUND_CONTESTANT_LIMIT_INVALID') {
        formErrors.roundLimit = message;
      }

      if (code === 'ROUND_CONTESTANT_LIMIT_LOCKED') {
        toast.warning(message, { title: 'Contestant Limit Locked' });
      } else if (code === 'ROUND_PRELIMINARY_LIMIT_LOCKED') {
        toast.warning(message, { title: 'Preliminary Limit Locked' });
      }

      if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Round Phase Not Found' });
      } else if (code === 'ROUND_PHASE_EDIT_ERROR') {
        toast.error(message, { title: 'Something went wrong' });
      }

      return false;
    } finally {
      loadingStates.isEditingRound = false;
    }
  };

  const deleteRound = async (id: number) => {
    try {
      const res = await roundService.deleteRound({ id });
      await getRound();
      toast.success(res.message);
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'ROUND_PHASE_CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Round Phase Locked' });
      } else if (code === 'ROUND_PHASE_HAS_CONTESTANTS') {
        toast.warning(message, { title: 'Existing Contestants' });
      } else if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Round Phase Not Found' });
        await getRound();
      } else if (code === 'ROUND_PHASE_DELETE_ERROR') {
        toast.error(message, { title: 'Something went wrong' });
      }
    }
  };
  return {
    addRound,
    roundList,
    getRound,
    getRoundId,
    roundId,
    editRound,
    deleteRound,
    loadingStates,
    formErrors,
    clearFormErrors,
  };
});
