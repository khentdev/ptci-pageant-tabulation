<template>
  <BaseTable>
    <template #head>
      <BaseTableHeader>Action</BaseTableHeader>
      <BaseTableHeader>Round</BaseTableHeader>
      <BaseTableHeader>Performed By</BaseTableHeader>
      <BaseTableHeader>Role</BaseTableHeader>
      <BaseTableHeader wrap>Tie Resolution</BaseTableHeader>
      <BaseTableHeader>Date &amp; Time</BaseTableHeader>
    </template>
    <tr class="font-poppins" v-for="item in items" :key="item.id">
      <BaseTableCell>{{ actionLabel(item.action) }}</BaseTableCell>
      <BaseTableCell>{{ item.round.name }}</BaseTableCell>
      <BaseTableCell>{{ item.actor.name }}</BaseTableCell>
      <BaseTableCell>{{ item.actorRole }}</BaseTableCell>
      <BaseTableCell :nowrap="false">{{ tieSummary(item.tieResolution) }}</BaseTableCell>
      <BaseTableCell>{{ formatDate(item.createdAt) }}</BaseTableCell>
    </tr>
  </BaseTable>
</template>

<script setup lang="ts">
import type {
  AuditContestantSnapshot,
  AuditTieResolution,
  GetAuditLogsDTO,
} from '@/types/admin/auditTrail/auditTrail';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

defineProps<{
  items: GetAuditLogsDTO[];
}>();

const actionLabel = (action: GetAuditLogsDTO['action']) =>
  action === 'ROUND_ADVANCED' ? 'Round Advanced' : 'Winners Declared';

const listNames = (contestants: AuditContestantSnapshot[]) =>
  contestants.map((c) => `#${c.candidateNumber} ${c.name}`).join(', ');

const tieSummary = (tie: AuditTieResolution | null) => {
  if (!tie) {
    return '—';
  }

  const parts: string[] = [];
  if (tie.advancementTie) {
    parts.push(`Advanced: ${listNames(tie.advancementTie.selectedContestants)}`);
  }
  if (tie.placementTie?.length) {
    for (const cluster of tie.placementTie) {
      parts.push(`${cluster.gender} placement: ${listNames(cluster.placementOrder)}`);
    }
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
</script>
