import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';

import { errorHandler } from '@/api/errors/errorHandler';
import { useToast } from '@/composables/Toast/useToast';
import * as AUTH_ERRORS from '@/types/auth/error';

import router from '../../router';
import { authService } from './service';

import type { loginInput, user } from '@/types/auth/userAuth';
import { isSessionFailureCode } from '@/types/auth/error';
import type { AuthErrorCodes } from '@/types/auth/error';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/errors';
export const useAuthStore = defineStore('auth', () => {
  const { toast } = useToast();
  const currentUser = ref<user | null>(null);

  const isInvalidCredentials = ref('');
  const sessionInitialized = ref(false);

  const systemErrors = reactive({
    sessionError: false,
  });

  const loadingStates = reactive({
    isLoggingIn: false,
    isRefreshingSession: false,
    isLoggingOut: false,
  });

  const isAdmin = computed(() => {
    return currentUser.value?.user?.role === 'ADMIN';
  });

  const loginUser = async (user: loginInput) => {
    loadingStates.isLoggingIn = true;
    try {
      const res = await authService.loginUser(user);
      currentUser.value = { user: res.data.user };
      await router.push({ name: 'admin-homepage' });
    } catch (error) {
      const { code, message, type } = errorHandler<AuthErrorCodes>(
        error as AxiosError<ErrorResponse<AuthErrorCodes>>,
      );
      if (type === 'offline') {
        toast.warning('Please check your internet connection and try again.', {
          title: 'You are offline',
        });
      }
      if (type === 'server_error' || type === 'unreachable' || type === 'timeout') {
        isInvalidCredentials.value = message;
      }
      if (code === 'INVALID_CREDENTIALS') {
        isInvalidCredentials.value = message;
      }
    } finally {
      loadingStates.isLoggingIn = false;
    }
  };

  let refreshPromise: Promise<void> | null = null;
  const checkAuth = async () => {
    if (loadingStates.isRefreshingSession && refreshPromise) {
      return refreshPromise;
    }
    loadingStates.isRefreshingSession = true;

    refreshPromise = (async () => {
      const MAX_RETRIES = 5;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const res = await authService.getMe();
          currentUser.value = res;
          break;
        } catch (err) {
          const { code, type } = errorHandler<AUTH_ERRORS.SessionErrorCodes>(
            err as AxiosError<ErrorResponse<AUTH_ERRORS.SessionErrorCodes>>,
          );
          if (code === AUTH_ERRORS.SESSION_LOCK_IN_PROGRESS && attempt < MAX_RETRIES - 1) {
            const baseDelay = 500;
            const maxDelay = 3000;
            const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
            const jitter = Math.random() * 200;
            await new Promise((r) => setTimeout(r, delay + jitter));
            continue;
          }
          if (isSessionFailureCode(code)) {
            currentUser.value = null;
            return;
          }

          if (
            type === 'offline' ||
            type === 'server_error' ||
            type === 'unreachable' ||
            type === 'timeout'
          ) {
            // I-shoshow nito yung blocking error UI with retry button
            systemErrors.sessionError = true;
            return;
          }
        }
      }
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
      sessionInitialized.value = true;
      loadingStates.isRefreshingSession = false;
    }
  };

  const logoutUser = async () => {
    loadingStates.isLoggingOut = true;

    try {
      await authService.logoutUser();
      currentUser.value = null;
      await router.replace({ name: 'login' });
    } finally {
      loadingStates.isLoggingOut = false;
    }
  };

  return {
    loginUser,
    isInvalidCredentials,
    loadingStates,
    isAdmin,
    checkAuth,
    currentUser,
    logoutUser,
    systemErrors,
    sessionInitialized,
  };
});
