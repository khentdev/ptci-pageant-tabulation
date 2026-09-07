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

    <div class="h-full bg-amber-500/0" v-if="liveStore.declaredWinners?.declaredWinners">
      <table class="w-full">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="px-2 text-nowrap">Placement</th>
            <th class="px-2 text-nowrap">Contestant</th>
            <th class="px-2 text-nowrap">Overall</th>
          </tr>
        </thead>
        <tbody
          class="w-full"
          v-for="contestant in liveStore.declaredWinners.declaredWinners"
          :key="contestant.contestant.id"
        >
          <tr class="font-poppins">
            <td class="border border-black/40 p-2 text-nowrap">
              <div class="flex items-center justify-center gap-2">
                <Award
                  v-if="contestant.placement === 1"
                  class="stroke fill-yellow-400 stroke-black/70"
                ></Award>
                <Award
                  v-else-if="contestant.placement === 2"
                  class="stroke fill-gray-500 stroke-black/70"
                ></Award>
                <Award
                  v-else-if="contestant.placement === 3"
                  class="stroke fill-amber-950 stroke-black/70"
                ></Award
                >{{ contestant.placement }}
              </div>
            </td>
            <td class="border border-black/40 p-2 text-nowrap">{{ contestant.contestant.name }}</td>

            <td class="border border-black/40 p-2 font-semibold text-nowrap">
              {{ contestant.overallScore }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="h-full bg-amber-500/0" v-else-if="liveStore.roundResult?.advancement">
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

        <tbody>
          <template v-for="(r, index) in liveStore.roundResult?.rankings" :key="r.contestant.id">
            <tr
              v-if="cutoffIndex > 0 && index === cutoffIndex"
              class="bg-red-800 font-bold text-white"
            >
              <td
                :colspan="3 + (liveStore.roundResult?.rankings[0]?.categories.length || 0)"
                class="py-1 text-center text-xs tracking-widest uppercase"
              >
                — — — — — — Cutoff Line — — — — — —
              </td>
            </tr>

            <tr
              class="font-poppins transition-colors"
              :class="{
                'bg-red-50 font-semibold text-red-900': isContestantTied(r.contestant.id),
              }"
            >
              <td class="border border-black/40 p-2 text-nowrap">{{ r.rank ?? '-' }}</td>

              <td class="border border-black/40 p-2 text-nowrap">
                <div class="flex items-center justify-between gap-2">
                  <span>{{ r.contestant.name }}</span>

                  <span
                    v-if="isContestantTied(r.contestant.id)"
                    class="rounded bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800"
                  >
                    ← tied
                  </span>
                </div>
              </td>

              <td
                v-for="score in r.categories"
                :key="score.id"
                class="border border-black/40 p-2 font-semibold text-nowrap"
              >
                {{ score.avgScore ?? '-' }}
              </td>

              <td class="border border-black/40 p-2 font-semibold text-nowrap">
                {{ r.overallScore ?? '-' }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Award } from '@lucide/vue';
import { computed } from 'vue';

const liveStore = useLiveStore();

const tiedContestantIds = computed(() => {
  const tiedList = liveStore.roundResult?.advancement?.tied || [];
  return new Set(tiedList.map((c) => c.id));
});

const isContestantTied = (contestantId: number): boolean => {
  return tiedContestantIds.value.has(contestantId);
};

const cutoffIndex = computed(() => {
  return liveStore.roundResult?.advancement?.included?.length ?? 0;
});


</script>
