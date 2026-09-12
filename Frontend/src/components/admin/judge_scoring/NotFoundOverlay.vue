<template>
  <div
    class="font-poppins inset-0 flex h-full w-full items-center justify-center px-4"
    role="alert"
    aria-labelledby="not-found-title"
    aria-describedby="not-found-description"
  >
    <div class="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl bg-white/95 p-6 text-center shadow-lg">
      <div class="flex items-center justify-center rounded-full bg-amber-100/70 p-4">
        <SearchX class="size-10 stroke-[1.5] text-amber-500" aria-hidden="true" />
      </div>

      <div class="flex flex-col gap-2">
        <h2 id="not-found-title" class="text-xl font-bold text-custom-black">
          Category Not Found
        </h2>
        <p id="not-found-description" class="text-sm text-custom-black/60">
          The category you're looking for doesn't exist or may have been removed.
        </p>
      </div>

      <router-link
        v-if="firstCategoryId"
        :to="{ name: 'judge-scoring-category', params: { categoriesId: firstCategoryId } }"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm font-semibold text-white transition-colors"
      >
        Go to First Category
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import { SearchX } from '@lucide/vue';
import { computed } from 'vue';

const judgeScoringStore = useJudgeScoringStore();
const firstCategoryId = computed(
  () => judgeScoringStore.judgeScoringRoundList[0]?.categories[0]?.id ?? null,
);
</script>
