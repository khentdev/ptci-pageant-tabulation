<template>
  <div class="gap flex w-full flex-col items-start gap-2">
    <div class="mt-4 flex items-center justify-between gap-2">
      <p class="text-xl font-medium text-black/70">Tie Resolution</p>
      <triangle-alert class="stroke animate-pulse fill-yellow-300 stroke-black/70"></triangle-alert>
    </div>

    <div
      class="bg-main-dark-brown flex h-full flex-col justify-center rounded-lg px-6 py-4 text-white"
    >
      <p class="my-4">Select {{ requiredSelections }} more to fill remaining spot</p>
      <div
        class="flex items-end justify-between"
        v-for="contestants in liveStore.roundResult?.advancement.tied"
        :key="contestants.id"
      >
        <div class="mt-2 flex w-full items-center gap-2">
          <input
            :id="`contestant-${contestants.id}`"
            :value="contestants.id"
            type="checkbox"
            class="size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="selectedCount >= requiredSelections && !isContestantSelected(contestants.id)"
            v-model="liveStore.selectedContestantIds"
          />
          <label :for="`contestant-${contestants.id}`" class="w-full">{{ contestants.name }}</label>
          <div class="flex w-full justify-end">
            <p class="font-bold">{{ contestants.overallScore }}</p>
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <p>Selected: {{ selectedCount }} of {{ requiredSelections }} required</p>
        <check v-if="liveStore.isTieResolved" class="stroke stroke-jungle-green-700"></check>
        <x v-else class="stroke stroke-red-500"></x>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Check, TriangleAlert, X } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
const liveStore = useLiveStore();

const selectedCount = computed(() => liveStore.selectedContestantIds.length);

const requiredSelections = computed(
  () => liveStore.roundResult?.advancement.requiredSelections ?? 0,
);

const isContestantSelected = (id: number): boolean => {
  return liveStore.selectedContestantIds.includes(id);
};
</script>
