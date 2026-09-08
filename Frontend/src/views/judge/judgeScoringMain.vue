<template>
  <div
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <div class="w-full">
        <p class="font-semibold text-black/70 sm:text-2xl">{{ currentRound?.name }}</p>
        <p class="font-normal text-black/70 sm:text-lg">{{ currentCategory?.name }}</p>
      </div>
      <div
        class="flex items-center gap-2"
        v-if="!judgeScoringStore.categoryScoresList?.isSubmitted"
      >
        <Check class="stroke stroke-jungle-green-800"></Check>
        <p class="text-black/70 sm:text-lg">Submitted</p>
      </div>
    </div>

    <div
      v-if="!currentRound?.hasContestants"
      class="flex h-full w-full flex-col items-center justify-center rounded-lg border border-black/30"
    >
      <p class="text-black/80">No data yet.</p>
      <p class="text-sm text-black/50">This round has not started.</p>
    </div>

    <div class="mt-4 flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto">
      <JudgeScoringFieldsTable></JudgeScoringFieldsTable>
      <div class="flex justify-end">
        <button
          class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 items-center gap-2 rounded-lg px-6 py-4 text-xs text-white sm:h-15 sm:text-base"
        >
          Submit All
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import JudgeScoringFieldsTable from '@/components/admin/judge_scoring/judgeScoringFieldsTable.vue';
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import { Check } from '@lucide/vue';
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const judgeScoringStore = useJudgeScoringStore();

const activeCategoryId = computed(() => {
  const id = route.params.categoriesId;
  return id ? Number(id) : null;
});

const handleSubmit = (id: number) => {};

const currentRound = computed(() => {
  if (!activeCategoryId.value) {
    return null;
  }
  return judgeScoringStore.judgeScoringRoundList.find((r) =>
    r.categories.some((cat) => cat.id === activeCategoryId.value),
  );
});

const currentCategory = computed(() => {
  if (!currentRound.value && !activeCategoryId.value) {
    return null;
  }
  return currentRound.value?.categories.find((cat) => cat.id === activeCategoryId.value);
});

const fetchCategories = async (categoryId: number, roundId: number) => {
  try {
    await Promise.all([
      judgeScoringStore.getCategoryFields(categoryId),
      judgeScoringStore.getCategoryScores(categoryId),
      judgeScoringStore.getRoundContestants(roundId),
    ]);
  } catch (error) {
    console.log(error);
  }
};

watch(
  [activeCategoryId, currentRound],
  ([categoryId, roundId]) => {
    if (categoryId && roundId) {
      fetchCategories(categoryId, roundId.id);
    }
  },
  { immediate: true },
);
</script>
