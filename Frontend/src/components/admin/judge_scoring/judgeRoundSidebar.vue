<template>
  <div v-for="r in judgeScoringStore.judgeScoringRoundList" :key="r.id" class="flex flex-col gap-2">
    <div
      @click="toggleDropDown(r.id)"
      class="flex cursor-pointer items-center gap-2 rounded-lg border border-black/30 px-4 py-2 hover:bg-black/5 sm:p-4"
    >
      <chevron-down></chevron-down>
      <p class="cursor-pointer">{{ r.name }}</p>
    </div>
    <div class="flex flex-col gap-2 px-4" v-if="openRoundId === r.id">
      <RouterLink
        v-for="c in r.categories"
        :key="c.id"
        :to="`/judge/scoring/${c.id}`"
        class="flex cursor-pointer items-center gap-2 rounded-lg border border-black/30 px-4 py-2"
      >
        <layout-grid class="size-5"></layout-grid>{{ c.name }}
      </RouterLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import { ChevronDown, LayoutGrid } from '@lucide/vue';
import { onMounted, computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const judgeScoringStore = useJudgeScoringStore();
const route = useRoute();
const emits = defineEmits<{
  roundName: [name: string];
}>();

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
