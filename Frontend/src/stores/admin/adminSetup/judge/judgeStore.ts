import { useToast } from '@/composables/Toast/useToast';
import type {
  AddJudgeInput,
  EditJudgeInput,
  GetJudgeListDTO,
  ResetJudgePasswordInput,
} from '@/types/admin/adminSetup/judge/judge';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { ErrorResponse } from '@/api/errors';
import type { AxiosError } from 'axios';
import { errorHandler } from '@/api/errors/errorHandler';
import { judgeService } from './service';
import type { JudgeErrorCodes } from '@/types/admin/adminSetup/judge/error';

export const useJudgeStore = defineStore('judge', () => {
  const { toast } = useToast();
  const judgeList = ref<GetJudgeListDTO[]>([]);

  const formErrors = reactive({
    judgeName: '',
    judgeUsername: '',
    judgePassword: '',
  });

  const clearFormErrors = () => {
    formErrors.judgeName = '';
    formErrors.judgeUsername = '';
    formErrors.judgePassword = '';
  };

  const loadingStates = reactive({
    isFetchingJudgeList: false,
    isFetchingJudgeId: false,
    isAddingJudges: false,
    isEditingJudges: false,
    isResettingPassword: false,
    isDeletingJudge: false,
  });

  const errorStates = reactive({
    isFetchingJudgeListError: false,
    isFetchingJudgeIdError: false,
  });

  const getJudgesList = async () => {
    if (loadingStates.isFetchingJudgeList) {
      return;
    }
    loadingStates.isFetchingJudgeList = true;
    try {
      const res = await judgeService.getJudgesList();
      judgeList.value = res.data;
      errorStates.isFetchingJudgeListError = false;
    } catch (error) {
      const { code, type, message } = errorHandler<JudgeErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeErrorCodes>>,
      );
      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingJudgeListError = true;
      }

      if (code === 'JUDGE_GET_LIST_FAILED') {
        toast.error(message);
      }
    } finally {
      loadingStates.isFetchingJudgeList = false;
    }
  };

  const addJudges = async (judgesInput: AddJudgeInput): Promise<boolean> => {
    if (loadingStates.isAddingJudges) {
      return false;
    }

    loadingStates.isAddingJudges = true;
    try {
      const res = await judgeService.addJudges(judgesInput);
      await getJudgesList();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, type, message } = errorHandler<JudgeErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'JUDGE_NAME_TOO_SHORT') {
        formErrors.judgeName = message;
      } else if (code === 'JUDGE_USERNAME_TOO_SHORT') {
        formErrors.judgeUsername = message;
      } else if (code === 'JUDGE_PASSWORD_TOO_SHORT') {
        formErrors.judgePassword = message;
      }

      if (code === 'JUDGE_USERNAME_EXISTS') {
        toast.warning(message);
      } else if (code === 'JUDGE_ADD_FAILED') {
        toast.error(message);
      }
      return false;
    } finally {
      loadingStates.isAddingJudges = false;
    }
  };

  const editJudges = async (judgesInput: EditJudgeInput): Promise<boolean> => {
    if (loadingStates.isEditingJudges) {
      return false;
    }
    loadingStates.isEditingJudges = true;
    try {
      const res = await judgeService.editJudges(judgesInput);
      await getJudgesList();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, type, message } = errorHandler<JudgeErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'JUDGE_NAME_TOO_SHORT') {
        formErrors.judgeName = message;
      } else if (code === 'JUDGE_USERNAME_TOO_SHORT') {
        formErrors.judgeUsername = message;
      } else if (code === 'JUDGE_PASSWORD_TOO_SHORT') {
        formErrors.judgePassword = message;
      }

      if (code === 'JUDGE_USERNAME_EXISTS') {
        toast.warning(message);
      } else if (code === 'JUDGE_EDIT_FAILED') {
        toast.error(message);
      } else if (code === 'JUDGE_NOT_FOUND') {
        toast.warning(message);
      }
      return false;
    } finally {
      loadingStates.isEditingJudges = false;
    }
  };

  const resetPassword = async (resetPasswordInput: ResetJudgePasswordInput): Promise<boolean> => {
    if (loadingStates.isResettingPassword) {
      return false;
    }
    loadingStates.isResettingPassword = true;
    try {
      const res = await judgeService.resetPassword(resetPasswordInput);
      await getJudgesList();
      toast.success(res.message);
      return true;
    } catch (error) {
      const { code, type, message } = errorHandler<JudgeErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'JUDGE_RESET_PASSWORD_FAILED') {
        toast.error(message);
      } else if (code === 'JUDGE_PASSWORD_TOO_SHORT') {
        formErrors.judgePassword = message;
      } else if (code === 'JUDGE_NOT_FOUND') {
        toast.warning(message);
      }
      return false;
    } finally {
      loadingStates.isResettingPassword = false;
    }
  };

  const deleteJudge = async (id: number) => {
    if (loadingStates.isDeletingJudge) {
      return;
    }
    loadingStates.isDeletingJudge = true;
    try {
      const res = await judgeService.deleteJudge(id);
      await getJudgesList();
      toast.success(res.message);
    } catch (error) {
      const { code, type, message } = errorHandler<JudgeErrorCodes>(
        error as AxiosError<ErrorResponse<JudgeErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning(message, { title: 'You are Offline' });
      }
      if (type === 'server_error' || type === 'timeout' || type === 'unreachable') {
        toast.error(message, { title: 'Server Error' });
      }
      if (code === 'JUDGE_DELETE_FAILED') {
        toast.error(message);
      } else if (code === 'JUDGE_NOT_FOUND') {
        toast.warning(message);
      } else if (code === 'JUDGE_LOCKED') {
        toast.warning(message);
      }
    } finally {
      loadingStates.isDeletingJudge = false;
    }
  };

  return {
    deleteJudge,
    resetPassword,
    editJudges,
    addJudges,
    getJudgesList,
    judgeList,
    formErrors,
    clearFormErrors,
    loadingStates,
    errorStates,
  };
});
