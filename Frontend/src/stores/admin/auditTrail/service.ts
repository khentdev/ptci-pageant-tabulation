import { axiosInstance } from '@/api/axios/axiosConfig';
import type { GetAuditLogsResponse } from '@/types/admin/auditTrail/auditTrail';

export const GetTypeResponse = <T>(res: unknown): T => res as T;

export const auditTrailService = {
  getAuditLogs: async () => {
    const res = await axiosInstance.get('/audit-trail');
    return GetTypeResponse<GetAuditLogsResponse>(res);
  },
};
