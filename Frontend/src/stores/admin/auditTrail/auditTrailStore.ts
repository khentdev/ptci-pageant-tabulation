import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { auditTrailService } from './service';
import type { GetAuditLogsDTO } from '@/types/admin/auditTrail/auditTrail';
import type { auditTrailErrorCodes } from '@/types/admin/auditTrail/error';
import { errorHandler } from '@/api/errors/errorHandler';
import type { ErrorResponse } from '@/api/errors';
import type { AxiosError } from 'axios';

export const useAuditTrailStore = defineStore('auditTrailStore', () => {
  const auditLogs = ref<GetAuditLogsDTO[]>([]);

  const loadingStates = reactive({
    isFetchingAuditLogs: false,
  });

  const errorStates = reactive({
    isFetchingAuditLogsError: false,
  });

  const getAuditLogs = async () => {
    if (loadingStates.isFetchingAuditLogs) {
      return;
    }
    loadingStates.isFetchingAuditLogs = true;
    try {
      const res = await auditTrailService.getAuditLogs();
      auditLogs.value = res.data;
      errorStates.isFetchingAuditLogsError = false;
    } catch (error) {
      const { type } = errorHandler<auditTrailErrorCodes>(
        error as AxiosError<ErrorResponse<auditTrailErrorCodes>>,
      );

      if (
        type === 'offline' ||
        type === 'server_error' ||
        type === 'timeout' ||
        type === 'unreachable'
      ) {
        errorStates.isFetchingAuditLogsError = true;
      }
    } finally {
      loadingStates.isFetchingAuditLogs = false;
    }
  };

  return {
    auditLogs,
    loadingStates,
    errorStates,
    getAuditLogs,
  };
});
