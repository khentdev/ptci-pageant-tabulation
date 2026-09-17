<template>
  <BaseTable>
    <template #head>
      <BaseTableHeader align="center">Candidate Number</BaseTableHeader>
      <BaseTableHeader align="center">Contestants</BaseTableHeader>
      <BaseTableHeader
        align="center"
        wrap
        v-for="f in judgeScoringStore.categoryFieldsList?.fields"
        :key="f.id"
      >
        <div>{{ f.name }}</div>
        <span class="block text-xs font-normal opacity-80">(Max: {{ f.maxValue }})</span>
      </BaseTableHeader>
    </template>
    <tr
      class="font-poppins text-nowrap"
      v-for="con in judgeScoringStore.contestantsList"
      :key="con.id"
    >
      <BaseTableCell>
        <span class="mr-2 text-sm font-semibold">#{{ con.candidateNumber }}</span>
      </BaseTableCell>
      <BaseTableCell class="font-medium">
        {{ con.name }}
        <span
          class="block text-xs font-semibold opacity-80"
          :class="con.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
        >
          ( {{ con.gender }} )</span
        >
      </BaseTableCell>
      <BaseTableCell v-for="f in judgeScoringStore.categoryFieldsList?.fields" :key="f.id">
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
      </BaseTableCell>
    </tr>
  </BaseTable>
</template>

<script setup lang="ts">
import { useJudgeScoringStore } from '@/stores/admin/adminSetup/judge_scoring/judgeScoring';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

const judgeScoringStore = useJudgeScoringStore();

const handleScoreInput = (e: Event, contestantId: number, fieldId: number, maxValue: number) => {
  const input = e.target as HTMLInputElement;
  let rawValue = input.value;

  rawValue = rawValue.replace(/[^0-9.]/g, '');

  if (rawValue === '0') {
    rawValue = '1';
  }
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

  localStorage.setItem(`judge-draft-${contestantId}-${fieldId}`, rawValue);
};
</script>
