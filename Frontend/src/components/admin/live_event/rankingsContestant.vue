<template>
  <div class="gap flex w-full flex-col gap-2">
    <div class="mt-4 flex justify-between">
      <p class="text-xl font-medium text-black/70">Rankings</p>
      <span
        v-if="liveStore.roundResult?.winnersDeclaredAt"
        class="bg-jungle-green-800/10 text-jungle-green-800 rounded-lg px-3 py-1 text-sm font-semibold"
      >
        Winners Declared
      </span>
    </div>

    <div class="h-full bg-amber-500/0">
      <table class="w-full">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="px-2 text-nowrap">Rank</th>
            <th class="px-2 text-nowrap">Contestant</th>
            <th
              class="px-2 text-nowrap"
              v-for="categories in liveStore.roundResult?.rankings[0]?.categories"
              :key="categories.id"
            >
              {{ categories.name }}
            </th>
            <th class="px-2 text-nowrap">Overall</th>
          </tr>
        </thead>
        <tbody class="w-full" v-for="r in liveStore.roundResult?.rankings" :key="r.contestant.id">
          <tr class="font-poppins">
            <td class="border border-black/40 p-2 text-nowrap">{{ r.rank }}</td>
            <td class="border border-black/40 p-2 text-nowrap">{{ r.contestant.name }}</td>
            <td
              class="border border-black/40 p-2 font-semibold text-nowrap"
              v-for="score in r.categories"
              :key="score.id"
            >
              {{ score.avgScore }}
            </td>
            <td class="border border-black/40 p-2 font-semibold text-nowrap">
              {{ r.overallScore }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Check, X } from '@lucide/vue';
const liveStore = useLiveStore();
</script>
