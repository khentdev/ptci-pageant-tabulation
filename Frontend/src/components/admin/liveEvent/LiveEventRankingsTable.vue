<template>
  <div class="mt-8 flex w-full flex-col gap-8">
    <div v-if="liveStore.declaredWinners?.declaredWinners" class="flex flex-col gap-8">
      <div v-for="group in declaredGroups" :key="group.gender" class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-col">
            <h2 class="text-lg font-medium text-black/70 sm:text-xl">Rankings</h2>
            <p
              class="text-sm font-semibold"
              :class="group.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
            >
              {{ genderLabel(group.gender) }}
            </p>
          </div>

          <span
            v-if="liveStore.roundResult?.winnersDeclaredAt"
            class="bg-jungle-green-800/10 text-jungle-green-800 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-semibold text-nowrap"
          >
            Winners Declared
          </span>
        </div>

        <div class="overflow-x-auto md:overflow-visible">
          <BaseTable>
            <template #head>
              <BaseTableHeader align="center">Placement</BaseTableHeader>
              <BaseTableHeader align="center">Cand. #</BaseTableHeader>
              <BaseTableHeader>Contestant</BaseTableHeader>
              <BaseTableHeader align="center">Overall</BaseTableHeader>
            </template>
            <tr
              class="font-poppins"
              v-for="contestant in group.rows"
              :key="contestant.contestant.id"
            >
              <BaseTableCell>
                <div class="flex items-center justify-center gap-2">
                  <template v-if="group.rows.length <= 3">
                    <Award
                      v-if="contestant.placement === 1"
                      class="size-5 fill-yellow-400 stroke-black/70"
                      aria-hidden="true"
                    />
                    <Award
                      v-else-if="contestant.placement === 2"
                      class="size-5 fill-gray-500 stroke-black/70"
                      aria-hidden="true"
                    />
                    <Award
                      v-else-if="contestant.placement === 3"
                      class="size-5 fill-amber-950 stroke-black/70"
                      aria-hidden="true"
                    />
                  </template>
                  <span>{{ contestant.placement }}</span>
                </div>
              </BaseTableCell>
              <BaseTableCell class="text-center font-bold">
                {{ contestant.contestant.candidateNumber }}
              </BaseTableCell>
              <BaseTableCell>
                {{ contestant.contestant.name }}
              </BaseTableCell>
              <BaseTableCell class="text-center font-semibold">
                {{ contestant.overallScore }}
              </BaseTableCell>
            </tr>
          </BaseTable>
        </div>
      </div>
    </div>

    <div v-else-if="liveStore.roundResult?.advancement" class="flex flex-col gap-8">
      <BaseEmptyState
        v-if="(liveStore.roundResult?.rankings.length ?? 0) === 0"
        :icon="Users"
        title="No contestants yet"
        description="Advance contestants from the previous round to begin scoring."
      />
      <div v-else v-for="group in rankingGroups" :key="group.gender" class="flex flex-col gap-3">
        <div class="flex flex-col">
          <h2 class="text-lg font-medium text-black/70 sm:text-xl">Rankings</h2>
          <p
            class="text-sm font-semibold"
            :class="group.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
          >
            {{ genderLabel(group.gender) }}
          </p>
        </div>

        <div class="overflow-x-auto md:overflow-visible">
          <BaseTable>
            <template #head>
              <BaseTableHeader align="center">Rank</BaseTableHeader>
              <BaseTableHeader align="center">Cand. #</BaseTableHeader>
              <BaseTableHeader>Contestant</BaseTableHeader>
              <BaseTableHeader
                v-for="categories in group.rows[0]?.categories"
                :key="categories.id"
                align="center"
                wrap
              >
                {{ categories.name }}
              </BaseTableHeader>
              <BaseTableHeader align="center">Overall</BaseTableHeader>
            </template>

            <template v-for="(r, index) in group.rows" :key="r.contestant.id">
              <tr
                v-if="group.cutoffIndex > 0 && index === group.cutoffIndex"
                class="bg-red-800 font-bold text-white"
              >
                <!-- Left-aligned on small screens so it stays visible without scrolling. -->
                <td
                  :colspan="4 + (group.rows[0]?.categories.length || 0)"
                  class="px-3 py-1 text-left text-xs tracking-widest uppercase md:text-center"
                >
                  Cutoff line
                </td>
              </tr>

              <tr
                class="font-poppins transition-colors"
                :class="{
                  'bg-red-50 font-semibold text-red-900': isContestantTied(r.contestant.id),
                }"
              >
                <BaseTableCell class="text-center">{{ r.rank ?? '-' }}</BaseTableCell>

                <BaseTableCell class="text-center font-bold">
                  {{ r.contestant.candidateNumber }}
                </BaseTableCell>

                <BaseTableCell>
                  <div class="flex items-center gap-2">
                    <span>{{ r.contestant.name }}</span>
                    <span
                      v-if="isContestantTied(r.contestant.id)"
                      class="rounded bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800"
                    >
                      Tied
                    </span>
                  </div>
                </BaseTableCell>

                <BaseTableCell
                  v-for="score in r.categories"
                  :key="score.id"
                  class="text-center font-semibold"
                >
                  {{ score.avgScore ?? '-' }}
                </BaseTableCell>

                <BaseTableCell class="text-center font-semibold">
                  {{ r.overallScore ?? '-' }}
                </BaseTableCell>
              </tr>
            </template>
          </BaseTable>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import BaseEmptyState from '@/components/shared/BaseEmptyState.vue';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';
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
