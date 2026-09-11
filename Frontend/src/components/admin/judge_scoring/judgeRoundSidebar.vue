<template>
  <div v-if="judgeScoringStore.loadingStates.isFetchingRounds" class="flex items-center justify-center gap-2 py-6 text-sm text-black/60" role="status" aria-live="polite">
    <div
      class="size-4 animate-spin rounded-full border-2 border-jungle-green-900/20 border-t-jungle-green-900 motion-reduce:animate-none"
      aria-hidden="true"
    />
    <span>Loading rounds…</span>
  </div>

  <div
    v-else-if="judgeScoringStore.errorStates.isFetchingRoundsError"
    class="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 px-4 py-6 text-center"
    role="alert"
  >
    <AlertCircle class="size-6 text-red-500" aria-hidden="true" />
    <p class="text-sm text-black/70">Failed to load rounds.</p>
    <button
      type="button"
      @click="judgeScoringStore.getJudgeScoringRounds()"
      class="cursor-pointer rounded-lg bg-jungle-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-jungle-green-900"
    >
      Retry
    </button>
  </div>

  <template v-else>
    <p v-if="judgeScoringStore.judgeScoringRoundList.length === 0" class="py-6 text-center text-sm text-black/60">
      No rounds available.
    </p>

    <div v-for="r in judgeScoringStore.judgeScoringRoundList" :key="r.id" class="flex flex-col gap-2">
      <div
        @click="toggleDropDown(r.id)"
        @keydown.enter.prevent="toggleDropDown(r.id)"
        @keydown.space.prevent="toggleDropDown(r.id)"
        role="button"
        tabindex="0"
        :aria-expanded="openRoundId === r.id"
        class="flex cursor-pointer items-center gap-2 rounded-lg border border-black/30 px-4 py-3 transition-colors hover:bg-black/5"
      >
        <chevron-down
          class="transition-transform"
          :class="{ 'rotate-180': openRoundId === r.id }"
        ></chevron-down>
        <p>{{ r.name }}</p>
      </div>
      <div class="flex flex-col gap-1.5 pl-2" v-if="openRoundId === r.id">
        <RouterLink
          v-for="c in r.categories"
          :key="c.id"
          :to="`/judge/scoring/${c.id}`"
          :exact-active-class="'bg-main-dark-brown text-white hover:bg-main-dark-brown'"
          class="flex cursor-pointer items-center gap-2 rounded-lg text-nowrap border border-black/30 px-4 py-2 transition-colors hover:bg-black/5"
        >
          <layout-grid class="size-5"></layout-grid>{{ c.name }}
        </RouterLink>
      </div>
    </div>
  </template>
</template>
<script setup lang="ts">
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import { AlertCircle, ChevronDown, LayoutGrid } from '@lucide/vue';
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
