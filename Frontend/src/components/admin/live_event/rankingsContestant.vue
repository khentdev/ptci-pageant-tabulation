<template>
  <div class="gap flex w-full flex-col mt-6">
    <div class="h-full bg-amber-500/0" v-if="liveStore.declaredWinners?.declaredWinners">
      <div
        v-for="group in declaredGroups"
        :key="group.gender"
        class="mb-4 flex flex-col gap-1 last:mb-0"
      >
        <div class="flex w-full items-center justify-between">
          <div class="flex flex-col">
            <p class="text-xl font-medium text-black/70">Rankings</p>
            <p
              class="text-sm font-semibold"
              :class="group.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
            >
              {{ genderLabel(group.gender) }}
            </p>
          </div>

          <span
            v-if="liveStore.roundResult?.winnersDeclaredAt"
            class="bg-jungle-green-800/10 text-jungle-green-800 rounded-lg px-3 py-1 text-sm font-semibold"
          >
            Winners Declared
          </span>
        </div>

        <table class="w-full">
          <thead class="sticky top-0 z-20 h-full rounded-xl">
            <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
              <th class="px-2 text-nowrap">Placement</th>
              <th class="px-2 text-nowrap">Contestant</th>
              <th class="px-2 text-nowrap">Overall</th>
            </tr>
          </thead>
          <tbody class="w-full" v-for="contestant in group.rows" :key="contestant.contestant.id">
            <tr class="font-poppins">
              <td class="border border-black/40 p-2 text-nowrap">
                <div class="flex items-center justify-center gap-2">
                  <template v-if="group.rows.length <= 3">
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
                    ></Award>
                    <span>{{ contestant.placement }}</span>
                  </template>
                  <span v-else>{{ contestant.placement }}</span>
                </div>
              </td>
              <td class="border border-black/40 p-2 text-nowrap">
                {{ contestant.contestant.name }}
              </td>

              <td class="border border-black/40 p-2 font-semibold text-nowrap">
                {{ contestant.overallScore }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="h-full bg-amber-500/0" v-else-if="liveStore.roundResult?.advancement">
      <EmptyState
        v-if="(liveStore.roundResult?.rankings.length ?? 0) === 0"
        :icon="Users"
        title="No contestants yet"
        description="Advance contestants from the previous round to begin scoring."
      />
      <div
        v-else
        v-for="group in rankingGroups"
        :key="group.gender"
        class="mb-4 flex flex-col gap-1 last:mb-0"
      >
        <div class="flex flex-col">
          <p class="text-xl font-medium text-black/70">Rankings</p>
          <p
            class="text-sm font-semibold"
            :class="group.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
          >
            {{ genderLabel(group.gender) }}
          </p>
        </div>
        <table class="w-full">
          <thead class="sticky top-0 z-20 h-full rounded-xl">
            <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
              <th class="px-2 text-nowrap">Rank</th>
              <th class="px-2 text-nowrap">Contestant</th>
              <th
                class="px-2 text-nowrap"
                v-for="categories in group.rows[0]?.categories"
                :key="categories.id"
              >
                {{ categories.name }}
              </th>
              <th class="px-2 text-nowrap">Overall</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="(r, index) in group.rows" :key="r.contestant.id">
              <tr
                v-if="group.cutoffIndex > 0 && index === group.cutoffIndex"
                class="bg-red-800 font-bold text-white"
              >
                <td
                  :colspan="3 + (group.rows[0]?.categories.length || 0)"
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
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import EmptyState from '@/components/shared/EmptyState.vue';
import { Award, Users } from '@lucide/vue';
import { computed } from 'vue';

const GENDERS = ['FEMALE', 'MALE'] as const;

const liveStore = useLiveStore();

const genderLabel = (gender: (typeof GENDERS)[number]) => (gender === 'FEMALE' ? 'Female' : 'Male');

const tiedContestantIds = computed(() => {
  const tiedList = liveStore.roundResult?.advancement?.tied || [];
  return new Set(tiedList.map((c) => c.id));
});

const isContestantTied = (contestantId: number): boolean => {
  return tiedContestantIds.value.has(contestantId);
};

// Advancement/rankings are computed independently per gender, so the cutoff
// line and rank numbering both restart within each gender's own rows.
const rankingGroups = computed(() => {
  const rankings = liveStore.roundResult?.rankings ?? [];
  const included = liveStore.roundResult?.advancement?.included ?? [];

  return GENDERS.map((gender) => ({
    gender,
    rows: rankings.filter((r) => r.contestant.gender === gender),
    cutoffIndex: included.filter((c) => c.gender === gender).length,
  })).filter((group) => group.rows.length > 0);
});

const declaredGroups = computed(() => {
  const winners = liveStore.declaredWinners?.declaredWinners ?? [];

  return GENDERS.map((gender) => ({
    gender,
    rows: winners.filter((w) => w.contestant.gender === gender),
  })).filter((group) => group.rows.length > 0);
});
</script>
