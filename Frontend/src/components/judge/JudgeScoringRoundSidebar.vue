<template>
  <div
    v-if="judgeScoringStore.loadingStates.isFetchingRounds"
    class="flex items-center justify-center gap-2 py-6 text-sm text-black/60"
    role="status"
    aria-live="polite"
  >
    <BaseSpinner />
    <span>Loading rounds…</span>
  </div>

  <div
    v-else-if="judgeScoringStore.errorStates.isFetchingRoundsError"
    class="flex flex-col items-center gap-2 py-6 text-center text-sm text-black/60"
    role="alert"
  >
    <p class="flex items-center gap-1.5">
      <AlertCircle class="size-4 shrink-0 text-red-600" aria-hidden="true" />
      Failed to load rounds.
    </p>
    <button
      type="button"
      @click="judgeScoringStore.getJudgeScoringRounds()"
      class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/30 px-3 py-1.5 text-black/70 transition-colors hover:bg-black/5"
    >
      <RotateCcw class="size-4 shrink-0" aria-hidden="true" />
      Retry
    </button>
  </div>

  <template v-else>
    <p
      v-if="judgeScoringStore.judgeScoringRoundList.length === 0"
      class="py-6 text-center text-sm text-black/60"
    >
      No rounds available.
    </p>

    <div
      v-for="r in judgeScoringStore.judgeScoringRoundList"
      :key="r.id"
      class="flex flex-col gap-1"
    >
      <!-- Sized and styled like an inactive BaseSidebarLink so rounds and links read as one list. -->
      <button
        type="button"
        :aria-expanded="openRoundId === r.id"
        :aria-controls="`round-${r.id}-categories`"
        class="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-black/70 transition-colors hover:bg-black/5 hover:text-black/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50"
        @click="toggleDropDown(r.id)"
      >
        <Calendar class="size-5 shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ r.name }}</span>
        <ChevronDown
          class="size-4 shrink-0 transition-transform motion-reduce:transition-none"
          :class="{ 'rotate-180': openRoundId === r.id }"
          aria-hidden="true"
        />
      </button>

      <div
        v-if="openRoundId === r.id"
        :id="`round-${r.id}-categories`"
        class="ml-5 flex flex-col gap-1 border-l border-black/10 pl-2"
      >
        <p v-if="r.categories.length === 0" class="px-3 py-2 text-sm text-black/60">
          No categories yet.
        </p>
        <BaseSidebarLink
          v-for="c in r.categories"
          :key="c.id"
          :to="`/judge/scoring/${c.id}`"
          :icon="Tags"
          :label="c.name"
        />
      </div>
    </div>
  </template>
</template>
<script setup lang="ts">
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import BaseSidebarLink from '@/components/shared/BaseSidebarLink.vue';
import BaseSpinner from '@/components/shared/BaseSpinner.vue';
import { AlertCircle, Calendar, ChevronDown, RotateCcw, Tags } from '@lucide/vue';
import { onMounted, ref } from 'vue';

const judgeScoringStore = useJudgeScoringStore();

const getDropDownState = (): number | null => {
  const savedState = localStorage.getItem('judge-toggle-dropdown');
  return savedState ? JSON.parse(savedState) : null;
};

const openRoundId = ref(getDropDownState());

const toggleDropDown = (id: number) => {
  openRoundId.value = openRoundId.value === id ? null : id;
  localStorage.setItem('judge-toggle-dropdown', JSON.stringify(openRoundId.value));
};

onMounted(async () => {
  await judgeScoringStore.getJudgeScoringRounds();
});
</script>
