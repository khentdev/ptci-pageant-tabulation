<template>
  <table class="relative w-full border-collapse">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-4 text-center text-nowrap">Contestants</th>
        <th
          class="px-4 text-center"
          v-for="f in judgeScoringStore.categoryFieldsList?.fields"
          :key="f.id"
        >
          <div>{{ f.name }}</div>
          <span class="block text-xs font-normal opacity-80">(Max: {{ f.maxValue }})</span>
        </th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr
        class="font-poppins text-nowrap"
        v-for="con in judgeScoringStore.contestantsList"
        :key="con.id"
      >
        <td class="border border-black/40 p-3 font-medium text-nowrap">
          <span class="mr-2 text-sm text-black/50">#{{ con.candidateNumber }}</span>
          {{ con.name }}
          <span class="block text-xs font-normal opacity-80">( {{ con.gender }} )</span>
        </td>
        <td
          class="border border-black/40 p-2 text-nowrap"
          v-for="f in judgeScoringStore.categoryFieldsList?.fields"
          :key="f.id"
        >
          <div class="flex items-center justify-center">
            <input
              v-if="judgeScoringStore.formScores[con.id]"
              type="text"
              inputmode="decimal"
              :disabled="judgeScoringStore.categoryScoresList?.isSubmitted"
              :value="judgeScoringStore.formScores[con.id]![f.id]"
              @input="(e) => handleScoreInput(e, con.id, f.id, f.maxValue)"
              class="focus:border-main-dark-brown focus:ring-main-dark-brown h-10 w-24 rounded border border-black/30 text-center font-semibold transition outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-black/10"
              placeholder="0"
            />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';

const judgeScoringStore = useJudgeScoringStore();

const handleScoreInput = (e: Event, contestantId: number, fieldId: number, maxValue: number) => {
  const input = e.target as HTMLInputElement;
  let rawValue = input.value;

  rawValue = rawValue.replace(/[^0-9.]/g, '');

  const decimalParts = rawValue.split('.');
  if (decimalParts.length > 2) {
    rawValue = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
  }

  if (decimalParts[1] && decimalParts[1].length > 2) {
    rawValue = `${decimalParts[0]}.${decimalParts[1].slice(0, 2)}`;
  }

  const numericValue = Number(rawValue);
  if (!isNaN(numericValue) && numericValue > maxValue) {
    rawValue = String(maxValue);
  }

  input.value = rawValue;
  if (judgeScoringStore.formScores[contestantId]) {
    judgeScoringStore.formScores[contestantId][fieldId] = rawValue;
  }
};
</script>
