<template>
  <BasePanel
    :title="currentRound?.name ?? 'Round Results'"
    :isLoading="liveStore.isFetchingLiveEvent"
    :isError="liveStore.isLiveEventServerError"
    errorTitle="Failed to Load Round Results"
    errorDescription="We couldn't load the round results. Please try again."
    :onRetry="() => fetchRoundResults(activeRoundId ?? 0)"
    :isNotFound="liveStore.isLiveEventNotFound"
  >
    <template #not-found>
      <NotFoundOverlay />
    </template>

    <JudgeSubmissions />
    <RankingsContestant />
    <TieResolution v-if="liveStore.roundResult?.advancement.hasTie" />
    <PlacementOrderResolution v-if="liveStore.roundResult?.placementTies?.length" />
    <div
      class="mt-3 font-medium text-red-600/70"
      v-if="!liveStore.roundResult?.canAdvance && advanceReasonText"
    >
      {{ advanceReasonText }}
    </div>
    <div
      v-if="liveStore.roundResult?.nextRound && showAdvanceSection"
      class="mt-4 flex w-full items-center justify-end px-4"
    >
      <button
        @click="handleAdvanceRound"
        :hidden="liveStore.roundResult.isCompleted"
        :disabled="!canAdvanceRound || liveStore.loadingStates.isAddingAdvanceRound"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 disabled:bg-jungle-green-800/50 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white disabled:cursor-not-allowed sm:h-15 sm:text-base"
      >
        {{
          liveStore.loadingStates.isAddingAdvanceRound
            ? 'Advancing...'
            : `Advance to ${liveStore.roundResult?.nextRound?.name}`
        }}
      </button>
    </div>
    <div
      v-else-if="liveStore.roundResult?.nextRound && authStore.isAdmin && liveStore.roundResult.advancement.hasTie"
      class="mt-3 font-medium text-red-600/70"
    >
      A tie must be resolved by the Chairman before advancing.
    </div>

    <div
      v-else-if="liveStore.roundResult && !liveStore.roundResult.winnersDeclaredAt && showDeclareSection"
      class="mt-4 flex w-full items-center justify-end px-4"
    >
      <button
        :disabled="!canDeclareRound || liveStore.loadingStates.isAddingDeclaredWinners"
        @click="handleDeclareWinners"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 disabled:bg-jungle-green-800/50 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white disabled:cursor-not-allowed sm:h-15 sm:text-base"
      >
        {{ liveStore.loadingStates.isAddingDeclaredWinners ? 'Declaring...' : 'Declare Winners' }}
      </button>
    </div>
    <div
      v-else-if="
        liveStore.roundResult &&
        !liveStore.roundResult.winnersDeclaredAt &&
        authStore.isAdmin &&
        (liveStore.roundResult.advancement.hasTie || Boolean(liveStore.roundResult.placementTies?.length))
      "
      class="mt-3 font-medium text-red-600/70"
    >
      A tie must be resolved by the Chairman before declaring winners.
    </div>
  </BasePanel>
</template>
<script setup lang="ts">
import JudgeSubmissions from '@/components/admin/live_event/judgeSubmissions.vue';
import NotFoundOverlay from '@/components/admin/live_event/NotFoundOverlay.vue';
import PlacementOrderResolution from '@/components/admin/live_event/placementOrderResolution.vue';
import RankingsContestant from '@/components/admin/live_event/rankingsContestant.vue';
import TieResolution from '@/components/admin/live_event/tieResolution.vue';
import BasePanel from '@/components/shared/BasePanel.vue';
import { useAuthStore } from '@/stores/auth/authStore';
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const roundStore = useRoundStore();
const liveStore = useLiveStore();
const authStore = useAuthStore();

// Ties are a judging call — Chairman resolves them, Admin handles every
// routine (tie-free) advance/declare. Each side's action section is only
// shown to the role actually allowed to perform it right now.
const showAdvanceSection = computed(() => {
  const hasTie = liveStore.roundResult?.advancement.hasTie ?? false;
  return authStore.isChairman ? hasTie : !hasTie;
});

const showDeclareSection = computed(() => {
  const hasTie =
    (liveStore.roundResult?.advancement.hasTie ?? false) ||
    Boolean(liveStore.roundResult?.placementTies?.length);
  return authStore.isChairman ? hasTie : !hasTie;
});

const activeRoundId = computed<number | null>(() => {
  const raw = route.params.roundId;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
});

const canAdvanceRound = computed(() => {
  if (
    !liveStore.roundResult ||
    !liveStore.roundResult.canAdvance ||
    !liveStore.roundResult.allJudgesSubmitted ||
    liveStore.isLiveEventServerError
  ) {
    return false;
  }

  if (liveStore.roundResult.advancement.hasTie) {
    return liveStore.isTieResolved;
  }

  return true;
});

const canDeclareRound = computed(() => {
  if (
    !liveStore.roundResult ||
    !liveStore.roundResult.allJudgesSubmitted ||
    liveStore.isLiveEventServerError
  ) {
    return false;
  }

  if (liveStore.roundResult.advancement.hasTie) {
    return liveStore.isTieResolved;
  }

  if (liveStore.roundResult.placementTies?.length) {
    return liveStore.isPlacementOrderResolved;
  }

  return liveStore.roundResult.canDeclareWinners;
});

const handleAdvanceRound = async () => {
  if (!activeRoundId.value) {
    return;
  }
  const isSuccess = await liveStore.addAdvanceRound(activeRoundId.value);
  if (isSuccess) {
    await fetchRoundResults(activeRoundId.value);
  }
};

const handleDeclareWinners = async () => {
  if (!activeRoundId.value) {
    return;
  }
  const isSuccess = await liveStore.addDeclareWinners(activeRoundId.value);
  if (isSuccess) {
    await fetchRoundResults(activeRoundId.value);
  }
};

const currentRound = computed(() => roundStore.roundList.find((r) => r.id === activeRoundId.value));

const fetchRoundResults = async (roundId: number) => {
  await Promise.all([
    liveStore.getJudgeSubmissionsById(roundId),
    liveStore.getRoundResults(roundId),
    liveStore.getDeclaredWinners(roundId),
  ]);
};

const advanceReasonText = computed(() => {
  const reason = liveStore.roundResult?.canAdvanceReason;
  switch (reason) {
    case 'JUDGES_NOT_COMPLETE':
      return 'All judges must submit their scores before advancing.';
    case 'CURRENT_ROUND_NO_CATEGORIES':
      return 'This round has no categories configured.';
    case 'NEXT_ROUND_ALREADY_FILLED':
      return 'The next round already contains contestants.';
    case 'NEXT_ROUND_NO_CATEGORIES':
      return 'The next round has no categories configured.';
    case 'ROUND_COMPLETED':
      return 'This round has already been completed.';
    default:
      return null;
  }
});

watch(
  activeRoundId,
  (newId) => {
    if (roundStore.roundList.length === 0) {
      roundStore.getRound();
    }
    if (newId) {
      fetchRoundResults(newId);
    }
  },
  { immediate: true },
);
</script>
