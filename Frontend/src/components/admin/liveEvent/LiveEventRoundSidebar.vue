<script setup lang="ts">
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import BaseSpinner from '@/components/shared/BaseSpinner.vue';
import BaseSidebarLink from '@/components/shared/BaseSidebarLink.vue';
import { AlertCircle, Calendar, RotateCcw } from '@lucide/vue';
import { onMounted } from 'vue';

const roundStore = useRoundStore();

onMounted(async () => {
  await roundStore.getRound();
});
</script>

<template>
  <div
    v-if="roundStore.loadingStates.isFetchingRounds && roundStore.roundList.length === 0"
    class="flex items-center justify-center gap-2 py-6 text-sm text-black/60"
    role="status"
    aria-live="polite"
  >
    <BaseSpinner />
    <span>Loading rounds…</span>
  </div>

  <div
    v-else-if="roundStore.errorStates.isFetchingRoundsError && roundStore.roundList.length === 0"
    class="flex flex-col items-center gap-2 py-6 text-center text-sm text-black/60"
    role="alert"
  >
    <p class="flex items-center gap-1.5">
      <AlertCircle class="size-4 shrink-0 text-red-600" aria-hidden="true" />
      Failed to load rounds.
    </p>
    <button
      type="button"
      @click="roundStore.getRound()"
      class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/30 px-3 py-1.5 text-black/70 transition-colors hover:bg-black/5"
    >
      <RotateCcw class="size-4 shrink-0" aria-hidden="true" />
      Retry
    </button>
  </div>

  <template v-else>
    <p v-if="roundStore.roundList.length === 0" class="py-6 text-center text-sm text-black/60">
      No rounds available.
    </p>

    <BaseSidebarLink
      v-for="round in roundStore.roundList"
      :key="round.id"
      :to="`/admin/live/results/${round.id}`"
      :icon="Calendar"
      :label="round.name"
    />
  </template>
</template>
