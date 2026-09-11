<script setup lang="ts">
import BasePanel from '@/components/shared/BasePanel.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import AuditTrailTable from '@/components/admin/auditTrail/auditTrailTable.vue';
import { useAuditTrailStore } from '@/stores/admin/auditTrail/auditTrailStore';
import { History } from '@lucide/vue';
import { onMounted } from 'vue';

const auditTrailStore = useAuditTrailStore();

onMounted(async () => {
  await auditTrailStore.getAuditLogs();
});
</script>

<template>
  <BasePanel
    title="Audit Trail"
    :isLoading="auditTrailStore.loadingStates.isFetchingAuditLogs"
    :isError="auditTrailStore.errorStates.isFetchingAuditLogsError"
    errorTitle="Failed to Load Audit Trail"
    errorDescription="We couldn't load the audit trail. Please try again."
    :onRetry="auditTrailStore.getAuditLogs"
  >
    <EmptyState
      v-if="auditTrailStore.auditLogs.length === 0"
      :icon="History"
      title="No audit entries yet"
      description="Round advancements and winner declarations will appear here."
    />
    <AuditTrailTable v-else :items="auditTrailStore.auditLogs" />
  </BasePanel>
</template>
