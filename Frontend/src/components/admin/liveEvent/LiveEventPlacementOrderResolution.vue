<template>
  <section class="mt-8 flex w-full flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-medium text-black/70 sm:text-xl">Placement Tie Resolution</h2>
      <span
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-semibold text-nowrap"
        :class="
          liveStore.isPlacementOrderResolved
            ? 'bg-jungle-green-800/10 text-jungle-green-800'
            : 'bg-red-600/10 text-red-700'
        "
      >
        <Check
          v-if="liveStore.isPlacementOrderResolved"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        <CircleAlert v-else class="size-4 shrink-0" aria-hidden="true" />
        {{ liveStore.isPlacementOrderResolved ? 'Resolved' : 'Not resolved' }}
      </span>
    </div>

    <p class="text-sm text-black/60">
      {{
        authStore.isChairman
          ? 'Set the finishing order for contestants tied on the same score.'
          : 'Waiting for the Chairman to set the finishing order.'
      }}
    </p>

    <div
      v-for="(cluster, index) in clusters"
      :key="index"
      class="rounded-lg border border-black/15"
    >
      <div
        class="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-2 text-sm"
      >
        <span
          class="font-semibold"
          :class="cluster.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
        >
          {{ genderLabel(cluster.gender) }}
        </span>
        <span class="text-black/60 tabular-nums">
          Tied at {{ cluster.contestants[0]?.overallScore }}
        </span>
      </div>

      <ul class="divide-y divide-black/10">
        <li
          v-for="contestant in cluster.contestants"
          :key="contestant.id"
          class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-black/70"
        >
          <label
            :for="`placement-rank-${contestant.id}`"
            class="flex min-w-0 flex-1 items-center gap-3"
          >
            <span
              v-if="candidateNumberById.has(contestant.id)"
              class="w-10 shrink-0 font-bold text-black/80 tabular-nums"
            >
              #{{ candidateNumberById.get(contestant.id) }}
            </span>
            <span class="min-w-0 flex-1 truncate">{{ contestant.name }}</span>
          </label>
          <select
            :id="`placement-rank-${contestant.id}`"
            :value="ranks[contestant.id] ?? ''"
            @change="(e) => setRank(contestant.id, (e.target as HTMLSelectElement).value)"
            :disabled="!authStore.isChairman"
            class="shrink-0 cursor-pointer rounded-lg border border-black/30 bg-white/60 px-2.5 py-1.5 text-sm text-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>Select rank</option>
            <option v-for="rank in cluster.contestants.length" :key="rank" :value="rank">
              {{ ordinal(rank) }}
            </option>
          </select>
        </li>
      </ul>

      <p
        v-if="hasDuplicateRanks(cluster)"
        class="flex items-center gap-1.5 border-t border-black/10 px-4 py-2 text-sm text-red-700"
        role="alert"
      >
        <CircleAlert class="size-4 shrink-0" aria-hidden="true" />
        Each position can only be used once.
      </p>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { useAuthStore } from '@/stores/auth/authStore';
import { Check, CircleAlert } from '@lucide/vue';
import { computed, reactive, watch } from 'vue';

const liveStore = useLiveStore();
const authStore = useAuthStore();

const genderLabel = (gender: 'MALE' | 'FEMALE') => (gender === 'FEMALE' ? 'Female' : 'Male');

const ordinal = (rank: number) => {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${rank}${suffixes[rank] ?? 'th'}`;
};

const clusters = computed(() => liveStore.roundResult?.placementTies ?? []);

// Tied contestants don't carry their candidate number, but the same round's
// rankings do, so look it up by contestant id.
const candidateNumberById = computed(
  () =>
    new Map(
      (liveStore.roundResult?.rankings ?? []).map((row) => [
        row.contestant.id,
        row.contestant.candidateNumber,
      ]),
    ),
);

// contestantId -> chosen rank within its own cluster (1-based, unique per cluster)
const ranks = reactive<Record<number, number | null>>({});

const setRank = (contestantId: number, rawValue: string) => {
  ranks[contestantId] = rawValue === '' ? null : Number(rawValue);
};

// Picking the same position twice leaves the cluster unresolved, so say why.
const hasDuplicateRanks = (cluster: (typeof clusters.value)[number]): boolean => {
  const assigned = cluster.contestants
    .map((contestant) => ranks[contestant.id])
    .filter((rank): rank is number => rank !== null && rank !== undefined);
  return new Set(assigned).size !== assigned.length;
};

watch(
  clusters,
  (newClusters) => {
    const knownIds = new Set(
      newClusters.flatMap((cluster) => cluster.contestants.map((c) => c.id)),
    );
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

      if (!isFullyResolved) {
        continue;
      }

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
