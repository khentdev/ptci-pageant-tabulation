import { defineStore } from 'pinia';
import { roundService } from './service';
import {
  type GetRoundByIdDTO,
  type AddRoundInput,
  type GetRoundsListDTO,
  type EditRoundInput,
} from '@/types/admin/adminSetup/rounds';
import { ref } from 'vue';
import { errorHandler } from '@/api/errors/errorHandler';
import type { RoundErrorCodes } from '@/types/admin/adminSetup/error';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
import { useToast } from '@/composables/Toast/useToast';

const { toast } = useToast();

export const useRoundStore = defineStore('roundStore', () => {
  const roundList = ref<GetRoundsListDTO[]>([]);
  const roundId = ref<GetRoundByIdDTO | null>(null);
  const isRoundNameInvalid = ref('');
  const isRoundPhaseInvalid = ref('');
  const isRoundLimitInvalid = ref('');

  const addRound = async (addRoundInput: AddRoundInput) => {
    try {
      const res = await roundService.addRound(addRoundInput);
      await getRound();
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );

      if (code === 'ROUND_NAME_INVALID') {
        isRoundNameInvalid.value = message;
      } else if (code === 'ROUND_PHASE_ORDER_INVALID') {
        isRoundPhaseInvalid.value = message;
      } else if (code === 'ROUND_CONTESTANT_LIMIT_INVALID') {
        toast.warning(message, { title: 'Warning' });
      }

      if (code === 'ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PHASE_ORDER_ALREADY_EXISTS') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PHASE_ORDER_DUPLICATE') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_CONTESTANT_LIMIT_REQUIRED') {
        isRoundLimitInvalid.value = message;
      }

      if (code === 'ROUND_PHASE_ADD_ERROR') {
        toast.error(message, { title: 'Error' });
      }
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

  const editRound = async (editRoundInput: EditRoundInput) => {
    try {
      const res = await roundService.editRound(editRoundInput);
      await getRound();

      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );

      if (code === 'ROUND_ID_INVALID') {
        toast.error(message, { title: 'Error' });
      } else if (code === 'ROUND_NAME_INVALID') {
        isRoundNameInvalid.value = message;
      } else if (code === 'ROUND_CONTESTANT_LIMIT_REQUIRED') {
        isRoundLimitInvalid.value = message;
      } else if (code === 'ROUND_CONTESTANT_LIMIT_INVALID') {
        isRoundLimitInvalid.value = message;
      }

      if (code === 'ROUND_CONTESTANT_LIMIT_LOCKED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PRELIMINARY_LIMIT_LOCKED') {
        toast.warning(message, { title: 'Warning' });
      }

      if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PHASE_EDIT_ERROR') {
        toast.error(message, { title: 'Error' });
      }
    }
  };

  const deleteRound = async (id: number) => {
    try {
      const res = await roundService.deleteRound(id);
      roundList.value = roundList.value.filter((item) => item.id !== id);
      toast.success(res.message, { title: 'Success' });
    } catch (error) {
      const { code, message, type } = errorHandler<RoundErrorCodes>(
        error as AxiosError<ErrorResponse<RoundErrorCodes>>,
      );

      if (code === 'ROUND_ID_INVALID') {
        toast.error(message, { title: 'Error' });
      } else if (code === 'ROUND_PHASE_CATEGORY_LOCKED') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PHASE_HAS_CONTESTANTS') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PHASE_NOT_FOUND') {
        toast.warning(message, { title: 'Warning' });
      } else if (code === 'ROUND_PHASE_DELETE_ERROR') {
        toast.error(message, { title: 'Error' });
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
    isRoundNameInvalid,
    isRoundPhaseInvalid,
    isRoundLimitInvalid,
  };
});
