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
    <div
      class="mt-3 font-medium text-red-600/70"
      v-if="!liveStore.roundResult?.canAdvance && advanceReasonText"
    >
      {{ advanceReasonText }}
    </div>
    <div
      v-if="liveStore.roundResult?.nextRound"
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
      v-else-if="liveStore.roundResult?.canDeclareWinners"
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
  </BasePanel>
</template>
<script setup lang="ts">
import JudgeSubmissions from '@/components/admin/live_event/judgeSubmissions.vue';
import NotFoundOverlay from '@/components/admin/live_event/NotFoundOverlay.vue';
import RankingsContestant from '@/components/admin/live_event/rankingsContestant.vue';
import TieResolution from '@/components/admin/live_event/tieResolution.vue';
import BasePanel from '@/components/shared/BasePanel.vue';
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const roundStore = useRoundStore();
const liveStore = useLiveStore();

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
    !liveStore.roundResult.canDeclareWinners ||
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
