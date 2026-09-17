<template>
  <section class="mt-8 flex w-full flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-medium text-black/70 sm:text-xl">Tie Resolution</h2>
      <span
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-semibold text-nowrap"
        :class="
          liveStore.isTieResolved
            ? 'bg-jungle-green-800/10 text-jungle-green-800'
            : 'bg-red-600/10 text-red-700'
        "
      >
        <Check v-if="liveStore.isTieResolved" class="size-4 shrink-0" aria-hidden="true" />
        <CircleAlert v-else class="size-4 shrink-0" aria-hidden="true" />
        {{
          liveStore.isTieResolved ? 'Resolved' : `${selectedCount}/${requiredSelections} selected`
        }}
      </span>
    </div>

    <p class="text-sm text-black/60">
      {{
        authStore.isChairman
          ? 'Choose which tied contestants advance to the next round.'
          : 'Waiting for the Chairman to choose which tied contestants advance.'
      }}
    </p>

    <div v-for="group in tieGroups" :key="group.gender" class="rounded-lg border border-black/15">
      <div
        class="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-2 text-sm"
      >
        <span
          class="font-semibold"
          :class="group.gender === 'FEMALE' ? 'text-pink-600' : 'text-blue-500'"
        >
          {{ genderLabel(group.gender) }}
        </span>
        <span class="text-black/60 tabular-nums">
          {{ group.selectedCount }} of {{ group.required }} selected
        </span>
      </div>

      <ul class="divide-y divide-black/10">
        <li v-for="contestant in group.tied" :key="contestant.id">
          <!-- The whole row is the label, so anywhere on it toggles the checkbox. -->
          <label
            class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm transition-colors"
            :class="rowClass(group, contestant.id)"
          >
            <input
              v-model="liveStore.selectedContestantIds"
              :value="contestant.id"
              type="checkbox"
              :disabled="isLocked(group, contestant.id)"
              class="accent-main-dark-brown size-4 shrink-0 disabled:cursor-not-allowed"
            />
            <span
              v-if="candidateNumberById.has(contestant.id)"
              class="w-10 shrink-0 font-bold text-black/80 tabular-nums"
            >
              #{{ candidateNumberById.get(contestant.id) }}
            </span>
            <span class="min-w-0 flex-1 truncate">{{ contestant.name }}</span>
            <span class="font-semibold tabular-nums">{{ contestant.overallScore }}</span>
          </label>
        </li>
      </ul>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { useAuthStore } from '@/stores/auth/authStore';
import { Check, CircleAlert } from '@lucide/vue';
import { computed } from 'vue';

const GENDERS = ['FEMALE', 'MALE'] as const;

const liveStore = useLiveStore();
const authStore = useAuthStore();

const genderLabel = (gender: (typeof GENDERS)[number]) => (gender === 'FEMALE' ? 'Female' : 'Male');

const selectedCount = computed(() => liveStore.selectedContestantIds.length);

const requiredSelections = computed(
  () => liveStore.roundResult?.advancement.requiredSelections ?? 0,
);

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

const isContestantSelected = (id: number): boolean => {
  return liveStore.selectedContestantIds.includes(id);
};

// A tie may exist in only one gender, both at once, or neither. Each
// gender's own required count is (that gender's round limit - that gender's
// auto-included count) — mirroring the backend's per-gender resolution so a
// checkbox only locks once its own gender's tie is satisfied, not the
// combined total. `nextRound.contestantLimit` is the limit used for the
// Advance flow (the only place a reachable tie panel appears in practice).
const tieGroups = computed(() => {
  const advancement = liveStore.roundResult?.advancement;
  const limit = liveStore.roundResult?.nextRound?.contestantLimit ?? null;
  if (!advancement) {
    return [];
  }

  return GENDERS.map((gender) => {
    const tied = advancement.tied.filter((c) => c.gender === gender);
    if (tied.length === 0) {
      return null;
    }

    const includedCount = advancement.included.filter((c) => c.gender === gender).length;
    const required = limit === null ? tied.length : Math.max(0, limit - includedCount);
    const tiedIds = new Set(tied.map((c) => c.id));
    const selectedCount = liveStore.selectedContestantIds.filter((id) => tiedIds.has(id)).length;

    return { gender, tied, required, selectedCount };
  }).filter((group): group is NonNullable<typeof group> => group !== null);
});

type TieGroup = (typeof tieGroups.value)[number];

// Only the Chairman can choose, and a gender locks its unselected rows once its quota is met.
const isLocked = (group: TieGroup, id: number): boolean =>
  !authStore.isChairman || (group.selectedCount >= group.required && !isContestantSelected(id));

const rowClass = (group: TieGroup, id: number): string => {
  const selectedClass = isContestantSelected(id)
    ? 'bg-main-dark-brown/10 font-semibold text-black/90'
    : 'text-black/70';

  if (isLocked(group, id)) {
    return `${selectedClass} cursor-not-allowed opacity-60`;
  }

  return isContestantSelected(id)
    ? `${selectedClass} cursor-pointer`
    : `${selectedClass} cursor-pointer hover:bg-black/5`;
};
</script>
