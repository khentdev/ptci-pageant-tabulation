<template>
  <div class="gap flex w-full flex-col items-start gap-2">
    <div class="mt-4 flex items-center justify-between gap-2">
      <p class="text-xl font-medium text-black/70">Tie Resolution</p>
      <triangle-alert class="stroke animate-pulse fill-yellow-300 stroke-black/70"></triangle-alert>
    </div>

    <div
      class="bg-main-dark-brown flex h-full w-full flex-col justify-center gap-4 rounded-lg px-6 py-4 text-white"
    >
      <div v-for="group in tieGroups" :key="group.gender" class="flex flex-col">
        <p class="my-2 text-sm font-semibold text-white/80">{{ genderLabel(group.gender) }}</p>
        <p class="mb-2">Select {{ group.required }} more to fill remaining spot(s)</p>
        <div
          class="flex items-end justify-between"
          v-for="contestant in group.tied"
          :key="contestant.id"
        >
          <div class="mt-2 flex w-full items-center gap-2">
            <input
              :id="`contestant-${contestant.id}`"
              :value="contestant.id"
              type="checkbox"
              class="size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="group.selectedCount >= group.required && !isContestantSelected(contestant.id)"
              v-model="liveStore.selectedContestantIds"
            />
            <label :for="`contestant-${contestant.id}`" class="w-full">{{ contestant.name }}</label>
            <div class="flex w-full justify-end">
              <p class="font-bold">{{ contestant.overallScore }}</p>
            </div>
          </div>
        </div>
        <p class="mt-2 text-sm text-white/80">
          Selected: {{ group.selectedCount }} of {{ group.required }} required
        </p>
      </div>

      <div class="mt-2 flex items-center gap-2 border-t border-white/20 pt-4">
        <p>Overall selected: {{ selectedCount }} of {{ requiredSelections }} required</p>
        <check v-if="liveStore.isTieResolved" class="stroke stroke-jungle-green-700"></check>
        <x v-else class="stroke stroke-red-500"></x>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Check, TriangleAlert, X } from '@lucide/vue';
import { computed } from 'vue';

const GENDERS = ['FEMALE', 'MALE'] as const;

const liveStore = useLiveStore();

const genderLabel = (gender: (typeof GENDERS)[number]) =>
  gender === 'FEMALE' ? 'Female' : 'Male';

const selectedCount = computed(() => liveStore.selectedContestantIds.length);

const requiredSelections = computed(
  () => liveStore.roundResult?.advancement.requiredSelections ?? 0,
);

const isContestantSelected = (id: number): boolean => {
  return liveStore.selectedContestantIds.includes(id);
};

// A tie may exist in only one gender, both at once, or neither. Each
// gender's own required count is (that gender's round limit - that gender's
// auto-included count) — mirroring the backend's per-gender resolution so a
// checkbox only locks once its own gender's tie is satisfied, not the
// combined total. `nextRound.contestantLimit` is the limit used for the
// Advance flow (the only place a reachable tie panel appears in practice).
const tieGroups = computed(() => {
  const advancement = liveStore.roundResult?.advancement;
  const limit = liveStore.roundResult?.nextRound?.contestantLimit ?? null;
  if (!advancement) {
    return [];
  }

  return GENDERS.map((gender) => {
    const tied = advancement.tied.filter((c) => c.gender === gender);
    if (tied.length === 0) {
      return null;
    }

    const includedCount = advancement.included.filter((c) => c.gender === gender).length;
    const required = limit === null ? tied.length : Math.max(0, limit - includedCount);
    const tiedIds = new Set(tied.map((c) => c.id));
    const selectedCount = liveStore.selectedContestantIds.filter((id) => tiedIds.has(id)).length;

    return { gender, tied, required, selectedCount };
  }).filter((group): group is NonNullable<typeof group> => group !== null);
});
</script>
