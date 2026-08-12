import { defineStore } from 'pinia';
import type { loginInput } from '@/types/auth/userAuth';
import { axiosInstance } from '@/api/axios/axiosConfig';
import { errorHandler } from '@/api/errors/errorHandler';
import { ref, computed } from 'vue';
import { authService } from './service';
import type { AuthErrorCodes } from '@/types/auth/error';
import type { Axios, AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';

export const useAuthStore = defineStore('auth', () => {
  const isInvalidCredentials = ref('');
  const isLoading = ref(false);
  const buttonDisabled = computed(() => ['disabled:opacity-50', 'disabled:cursor-not-allowed']);

  const loginUser = async (user: loginInput) => {
    isLoading.value = true;
    try {
      const res = await authService.loginUser(user);
      console.log(res.data.user);
    } catch (error) {
      const { code, message, type } = errorHandler<AuthErrorCodes>(
        error as AxiosError<ErrorResponse<AuthErrorCodes>>,
      );

      if (code === 'INVALID_CREDENTIALS') {
        isInvalidCredentials.value = message;
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    loginUser,
    isInvalidCredentials,
    buttonDisabled,
    isLoading,
  };
});
