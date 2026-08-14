import { defineStore } from 'pinia';
import type { loginInput, loginResponse, user } from '@/types/auth/userAuth';
import { axiosInstance } from '@/api/axios/axiosConfig';
import { errorHandler } from '@/api/errors/errorHandler';
import { ref, computed } from 'vue';
import { authService } from './service';
import type { AuthErrorCodes } from '@/types/auth/error';
import type { Axios, AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
import router from '../../router/auth/authRoutes';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<user | null>(null);
  const loginResponseUser = ref<loginResponse | null>();
  const isInvalidCredentials = ref('');
  const isLoading = ref(false);

  const buttonDisabled = computed(() => ['disabled:opacity-50', 'disabled:cursor-not-allowed']);
  const isAdmin = computed(() => currentUser?.value?.user.role === 'ADMIN');
  const isJudge = computed(() => currentUser.value?.user.role === 'JUDGE');

  const loginUser = async (user: loginInput) => {
    isLoading.value = true;
    try {
      const res = await authService.loginUser(user);
      loginResponseUser.value = res;
      await router.replace({ path: '/admin/live/results' });
      console.log(currentUser.value);
    } catch (error) {
      const { code, message } = errorHandler<AuthErrorCodes>(
        error as AxiosError<ErrorResponse<AuthErrorCodes>>,
      );

      if (code === 'INVALID_CREDENTIALS') {
        isInvalidCredentials.value = message;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const checkAuth = async () => {
    isLoading.value = true;
    try {
      const res = await authService.getMe();
      currentUser.value = res;
      console.log(res);
    } catch (error) {
      console.error('fetchUser failed:', error);
      currentUser.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const logoutUser = async () => {
    isLoading.value;

    try {
      const res = await authService.logoutUser();
      currentUser.value = null;
      window.location.reload();
      console.log(res.data.user);
    } catch (error) {
      console.log(error);
    } finally {
      isLoading.value;
    }
  };

  return {
    loginUser,
    isInvalidCredentials,
    buttonDisabled,
    isLoading,
    isAdmin,
    isJudge,
    checkAuth,
    currentUser,
    logoutUser,
  };
});
