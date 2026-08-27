import {
  type AddContestantInput,
  type EditContestantInput,
  type Gender,
  type GetAllContestantsDTO,
  type GetContestantByIdDTO,
} from '@/types/admin/adminSetup/contestants/contestants';
import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { contestantService } from './service';
import { useToast } from '@/composables/Toast/useToast';
import { errorHandler } from '@/api/errors/errorHandler';
import type { ContestantsErrorCodes } from '@/types/admin/adminSetup/contestants/error';
import { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
import { useRoute, useRouter } from 'vue-router';

export const useContestantStore = defineStore('contestantStore', () => {
  const { toast } = useToast();
  const router = useRouter();
  const route = useRoute();
  const contestantList = ref<GetAllContestantsDTO[]>([]);

  const formErrors = reactive({
    contestantNumber: '',
    contestantName: '',
    contestantGender: '',
    contestantTeamName: '',
    contestantTeamColor: '',
  });

  const clearFormErrors = () => {
    formErrors.contestantNumber = '';
    formErrors.contestantName = '';
    formErrors.contestantTeamName = '';
    formErrors.contestantTeamColor = '';
  };

  const loadingStates = reactive({
    isFetchingContestantList: false,
    isFetchingContestantId: false,
    isAddingContestants: false,
    isEditingContestants: false,
    isDeletingContestant: false,
  });

  const errorStates = reactive({
    isFetchingContestantListError: false,
    isFetchingContestantIdError: false,
  });

  const getContestants = async (filter?: Gender) => {
    if (loadingStates.isFetchingContestantList) {
      return;
    }
    loadingStates.isFetchingContestantList = true;
    try {
      const params = filter ? { filter } : undefined;
      const res = await contestantService.getContestants(params);
      contestantList.value = res.data;
      //toast.success(res.message);
    } catch (error) {
      const { code, type, message } = errorHandler<ContestantsErrorCodes>(
        error as AxiosError<ErrorResponse<ContestantsErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'CONTESTANT_FILTER_INVALID') {
        toast.warning(message);
      } else if (code === 'CONTESTANT_GET_ALL_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingContestantList = false;
    }
  };

  const addContestant = async (contestantInput: AddContestantInput): Promise<boolean> => {
    if (loadingStates.isAddingContestants) {
      return false;
    }
    loadingStates.isAddingContestants = true;
    try {
      const res = await contestantService.addContestant(contestantInput);
      await getContestants();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, type, message } = errorHandler<ContestantsErrorCodes>(
        error as AxiosError<ErrorResponse<ContestantsErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'CONTESTANT_CANDIDATE_NUMBER_REQUIRED') {
        formErrors.contestantNumber = message;
      } else if (code === 'CONTESTANT_NAME_REQUIRED') {
        formErrors.contestantName = message;
      } else if (code === 'CONTESTANT_GENDER_REQUIRED') {
        formErrors.contestantGender = message;
      } else if (code === 'CONTESTANT_TEAM_NAME_REQUIRED') {
        formErrors.contestantTeamName = message;
      } else if (code === 'CONTESTANT_TEAM_COLOR_REQUIRED') {
        formErrors.contestantTeamColor = message;
      }

      if (code === 'CONTESTANT_CANDIDATE_NUMBER_DUPLICATE') {
        toast.warning(message);
      } else if (code === 'CONTESTANT_GENDER_INVALID') {
        toast.warning(message);
      } else if (code === 'CONTESTANT_ADD_ERROR') {
        toast.error(message);
      }

      return false;
    } finally {
      loadingStates.isAddingContestants = false;
    }
  };

  const editContestant = async (contestantInput: EditContestantInput): Promise<boolean> => {
    if (loadingStates.isEditingContestants) {
      return false;
    }

    loadingStates.isEditingContestants = true;
    try {
      const res = await contestantService.editContestant(contestantInput);
      await getContestants();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, type, message } = errorHandler<ContestantsErrorCodes>(
        error as AxiosError<ErrorResponse<ContestantsErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'CONTESTANT_CANDIDATE_NUMBER_REQUIRED') {
        formErrors.contestantNumber = message;
      } else if (code === 'CONTESTANT_NAME_REQUIRED') {
        formErrors.contestantName = message;
      } else if (code === 'CONTESTANT_GENDER_REQUIRED') {
        formErrors.contestantGender = message;
      } else if (code === 'CONTESTANT_TEAM_NAME_REQUIRED') {
        formErrors.contestantTeamName = message;
      } else if (code === 'CONTESTANT_TEAM_COLOR_REQUIRED') {
        formErrors.contestantTeamColor = message;
      }
      return false;
    } finally {
      loadingStates.isEditingContestants = false;
    }
  };

  const getContestantsId = async (
    contestantId: number,
    closeModal?: () => void,
  ): Promise<GetContestantByIdDTO | null> => {
    if (loadingStates.isFetchingContestantId) {
      return null;
    }
    loadingStates.isFetchingContestantId = true;
    try {
      const res = await contestantService.getContestantsId(contestantId);
      errorStates.isFetchingContestantIdError = false;
      return res.data;
    } catch (error) {
      const { code, type, message } = errorHandler<ContestantsErrorCodes>(
        error as AxiosError<ErrorResponse<ContestantsErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'CONTESTANT_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'CONTESTANT_GET_BY_ID_ERROR') {
        toast.error(message);
      }
      return null;
    } finally {
      loadingStates.isFetchingContestantId = false;
    }
  };

  const deleteContestant = async (id: number) => {
    if (loadingStates.isDeletingContestant) {
      return;
    }
    loadingStates.isDeletingContestant = true;
    try {
      const res = await contestantService.deleteContestant(id);
      toast.success(res.message);
    } catch (error) {
      const { code, type, message } = errorHandler<ContestantsErrorCodes>(
        error as AxiosError<ErrorResponse<ContestantsErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }

      if (code === 'CONTESTANT_LOCKED') {
        toast.warning(message);
      } else if (code === 'CONTESTANT_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'CONTESTANT_DELETE_ERROR') {
        toast.error(message);
      }
    } finally {
      loadingStates.isDeletingContestant = false;
    }
  };

  const applyFilter = (gender?: Gender) => {
    router.push({
      query: {
        ...route.query,
        filter: gender || undefined,
      },
    });
  };

  return {
    applyFilter,
    getContestantsId,
    deleteContestant,
    contestantList,
    getContestants,
    loadingStates,
    errorStates,
    formErrors,
    clearFormErrors,
    addContestant,
    editContestant,
  };
});
