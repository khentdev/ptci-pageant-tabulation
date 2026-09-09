<template>
  <div class="gap flex w-full flex-col items-start gap-2">
    <div class="mt-4 flex items-center justify-between gap-2">
      <p class="text-xl font-medium text-black/70">Placement Tie Resolution</p>
      <triangle-alert class="stroke animate-pulse fill-yellow-300 stroke-black/70"></triangle-alert>
    </div>

    <div
      class="bg-main-dark-brown flex h-full w-full flex-col justify-center gap-4 rounded-lg px-6 py-4 text-white"
    >
      <div v-for="(cluster, index) in clusters" :key="index" class="flex flex-col">
        <p class="my-2 text-sm font-semibold text-white/80">
          {{ genderLabel(cluster.gender) }} — tied at {{ cluster.contestants[0]?.overallScore }}, choose finish
          order
        </p>
        <div
          class="mt-2 flex w-full items-center justify-between gap-2"
          v-for="contestant in cluster.contestants"
          :key="contestant.id"
        >
          <label class="w-full">{{ contestant.name }}</label>
          <select
            :value="ranks[contestant.id] ?? ''"
            @change="(e) => setRank(contestant.id, (e.target as HTMLSelectElement).value)"
            class="text-main-dark-brown rounded border border-black bg-white px-2 py-1"
          >
            <option value="" disabled>Select rank</option>
            <option v-for="rank in cluster.contestants.length" :key="rank" :value="rank">
              {{ ordinal(rank) }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-2 flex items-center gap-2 border-t border-white/20 pt-4">
        <p>Placement order resolved</p>
        <check v-if="liveStore.isPlacementOrderResolved" class="stroke stroke-jungle-green-700"></check>
        <x v-else class="stroke stroke-red-500"></x>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Check, TriangleAlert, X } from '@lucide/vue';
import { computed, reactive, watch } from 'vue';

const liveStore = useLiveStore();

const genderLabel = (gender: 'MALE' | 'FEMALE') => (gender === 'FEMALE' ? 'Female' : 'Male');

const ordinal = (rank: number) => {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${rank}${suffixes[rank] ?? 'th'}`;
};

const clusters = computed(() => liveStore.roundResult?.placementTies ?? []);

// contestantId -> chosen rank within its own cluster (1-based, unique per cluster)
const ranks = reactive<Record<number, number | null>>({});

const setRank = (contestantId: number, rawValue: string) => {
  ranks[contestantId] = rawValue === '' ? null : Number(rawValue);
};

watch(
  clusters,
  (newClusters) => {
    const knownIds = new Set(newClusters.flatMap((cluster) => cluster.contestants.map((c) => c.id)));
    for (const id of Object.keys(ranks)) {
      if (!knownIds.has(Number(id))) {
        delete ranks[Number(id)];
      }
    }
  },
  { immediate: true },
);

watch(
  [clusters, ranks],
  ([currentClusters]) => {
    const resolvedIds: number[] = [];

    for (const cluster of currentClusters) {
      const assigned = cluster.contestants.map((contestant) => ranks[contestant.id] ?? null);
      const isFullyResolved =
        assigned.every((rank) => rank !== null) && new Set(assigned).size === assigned.length;

      if (!isFullyResolved) continue;

      const ordered = [...cluster.contestants].sort(
        (a, b) => (ranks[a.id] ?? 0) - (ranks[b.id] ?? 0),
      );
      resolvedIds.push(...ordered.map((contestant) => contestant.id));
    }

    liveStore.placementOrder = resolvedIds;
  },
  { deep: true },
);
</script>
