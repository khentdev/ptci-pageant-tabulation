<template>
  <div
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2" v-if="!isCategoryNotFound">
      <div class="w-full">
        <p class="font-semibold text-black/70 sm:text-2xl">{{ currentRound?.name }}</p>
        <p class="font-normal text-black/70 sm:text-lg">{{ currentCategory?.name }}</p>
      </div>
      <div
        class="flex items-center gap-2"
        v-if="
          judgeScoringStore.categoryScoresList?.isSubmitted &&
          !judgeScoringStore.isFetchingCategoryDetails &&
          !judgeScoringStore.isFetchingCategoryDetailsError
        "
      >
        <Check class="stroke stroke-jungle-green-800" />
        <p class="text-black/70 sm:text-lg">Submitted</p>
      </div>
    </div>

    <div class="mt-4 flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto">
      <BaseFetchOverlay v-if="judgeScoringStore.isFetchingCategoryDetails" />
      <ServerErrorOverlay
        v-else-if="judgeScoringStore.isFetchingCategoryDetailsError"
        title="Failed to Load Category"
        description="We couldn't load this category's scoring details. Please try again."
        :onRetry="retryFetchCategories"
      />
      <NotFoundOverlay v-else-if="isCategoryNotFound" />
      <div
        v-else-if="!currentRound?.hasContestants"
        class="flex h-full w-full flex-col items-center justify-center rounded-lg border border-black/30"
      >
        <p class="text-black/80">No data yet.</p>
        <p class="text-sm text-black/50">This round has not started.</p>
      </div>
      <template v-else>
        <JudgeScoringFieldsTable />
        <div class="flex justify-end">
          <button
            v-if="!judgeScoringStore.categoryScoresList?.isSubmitted"
            @click="handleSubmit"
            :disabled="judgeScoringStore.loadingStates.isSubmittingCategoryScores"
            class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 cursor-pointer items-center gap-2 rounded-lg px-6 py-4 text-xs text-white transition disabled:opacity-50 sm:h-15 sm:text-base"
          >
            {{
              judgeScoringStore.loadingStates.isSubmittingCategoryScores
                ? 'Submitting...'
                : 'Submit All'
            }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
import ServerErrorOverlay from '@/components/shared/ServerErrorOverlay.vue';
import JudgeScoringFieldsTable from '@/components/admin/judge_scoring/judgeScoringFieldsTable.vue';
import NotFoundOverlay from '@/components/admin/judge_scoring/NotFoundOverlay.vue';
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import { Check } from '@lucide/vue';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const judgeScoringStore = useJudgeScoringStore();

const activeCategoryId = computed(() => {
  const id = route.params.categoriesId;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
});

const isCategoryIdInvalid = computed(() => activeCategoryId.value === undefined);

const isCategoryNotFound = computed(
  () => isCategoryIdInvalid.value || judgeScoringStore.isCategoryNotFound,
);

const currentRound = computed(() => {
  if (!activeCategoryId.value) {
    return undefined;
  }
  return judgeScoringStore.judgeScoringRoundList.find((r) =>
    r.categories.some((cat) => cat.id === activeCategoryId.value),
  );
});

const currentCategory = computed(() => {
  if (!currentRound.value || !activeCategoryId.value) {
    return undefined;
  }
  return currentRound.value.categories.find((cat) => cat.id === activeCategoryId.value);
});

const fetchCategoryDetails = async (categoryId: number) => {
  try {
    await Promise.all([
      judgeScoringStore.getCategoryFields(categoryId),
      judgeScoringStore.getCategoryScores(categoryId),
    ]);
    judgeScoringStore.initializeFormScores();
  } catch {}
};

const fetchContestants = async (roundId: number) => {
  try {
    await judgeScoringStore.getRoundContestants(roundId);
    judgeScoringStore.initializeFormScores();
  } catch {}
};

const retryFetchCategories = () => {
  if (activeCategoryId.value) {
    fetchCategoryDetails(activeCategoryId.value);
  }
  if (currentRound.value) {
    fetchContestants(currentRound.value.id);
  }
};

const handleSubmit = async () => {
  if (!activeCategoryId.value) {
    return;
  }
  await judgeScoringStore.submitCategoryScores(activeCategoryId.value);
};

watch(
  activeCategoryId,
  (categoryId) => {
    if (categoryId) {
      fetchCategoryDetails(categoryId);
    }
  },
  { immediate: true },
);

watch(
  currentRound,
  (round) => {
    if (round) {
      fetchContestants(round.id);
    }
  },
  { immediate: true },
);
</script>
