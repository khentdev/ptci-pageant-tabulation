<template>
  <table class="w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-4 text-nowrap">Action</th>
        <th class="px-4 text-nowrap">Round</th>
        <th class="px-4 text-nowrap">Performed By</th>
        <th class="px-4 text-nowrap">Role</th>
        <th class="px-4">Tie Resolution</th>
        <th class="px-4 text-nowrap">Date &amp; Time</th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr class="font-poppins" v-for="item in items" :key="item.id">
        <td class="border border-black/40 p-2 text-nowrap">{{ actionLabel(item.action) }}</td>
        <td class="border border-black/40 p-2 text-nowrap">{{ item.round.name }}</td>
        <td class="border border-black/40 p-2 text-nowrap">{{ item.actor.name }}</td>
        <td class="border border-black/40 p-2 text-nowrap">{{ item.actorRole }}</td>
        <td class="border border-black/40 p-2">{{ tieSummary(item.tieResolution) }}</td>
        <td class="border border-black/40 p-2 text-nowrap">{{ formatDate(item.createdAt) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type {
  AuditContestantSnapshot,
  AuditTieResolution,
  GetAuditLogsDTO,
} from '@/types/admin/auditTrail/auditTrail';

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
