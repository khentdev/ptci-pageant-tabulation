<template>
  <table class="relative w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-2 text-center text-nowrap">Contestants</th>
        <th
          class="px-2 text-center"
          v-for="f in judgeScoringStore.categoryFieldsList?.fields"
          :key="f.id"
        >
          {{ f.name }} ({{ f.maxValue }})
        </th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr
        class="font-poppins text-nowrap"
        v-for="con in judgeScoringStore.contestantsList"
        :key="con.id"
      >
        <td class="border border-black/40 p-2 text-nowrap">
          {{ con.name }}
        </td>
        <td
          class="border border-black/40 px-2 text-nowrap"
          v-for="f in judgeScoringStore.categoryFieldsList?.fields"
          :key="f.id"
        >
          <div class="flex items-center justify-center">
            <input
              type="text"
              class="h-full w-full text-center font-semibold outline-none"
              :maxlength="String(f.maxValue).length"
              inputmode="numeric"
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
</script>
