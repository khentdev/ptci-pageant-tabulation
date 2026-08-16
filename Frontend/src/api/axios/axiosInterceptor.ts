import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import router from '@/router';
import { isSessionFailureCode } from '@/types/auth/error';
import type { ErrorResponse } from '@/api/errors';

import { getFingerprint } from '../../utils/getFingerprint';
import { getCookie } from '../../utils/getCookieHelper';

const onRequest = async (config: InternalAxiosRequestConfig) => {
  // Session Cookie (ID) is http-only; already included in the request
  config.headers['X-Fingerprint'] = await getFingerprint();
  const csrfTokenName = 'csrfToken';
  config.headers['X-CSRF-Token'] = getCookie(csrfTokenName);
  return config;
};
const onRequestError = (error: AxiosError) => Promise.reject(error);

const onResponse = (response: AxiosResponse) => response.data;
let isRedirectingToLogin = false;

const onResponseError = async (error: AxiosError<ErrorResponse>) => {
  const code = error.response?.data?.error?.code;
  if (isSessionFailureCode(code)) {
    if (!isRedirectingToLogin && router.currentRoute.value.name !== 'login') {
      isRedirectingToLogin = true;
      try {
        await router.replace({ name: 'login' });
      } finally {
        isRedirectingToLogin = false;
      }
    }
  }
  return Promise.reject(error);
};

export const setupInterceptors = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(onRequest, onRequestError);
  axiosInstance.interceptors.response.use(onResponse, onResponseError);
};
