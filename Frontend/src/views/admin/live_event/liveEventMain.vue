<template>
  <div
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-normal text-black/70 sm:text-2xl">
        Round Results: <a class="font-semibold">{{ currentRound?.name }}</a>
      </p>

      <!--<button
        class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8" />
      </button>-->
    </div>

    <div v-if="currentRound" class="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto">
      <JudgeSubmissions></JudgeSubmissions>
      <RankingsContestant></RankingsContestant>
      <TieResolution v-if="liveStore.roundResult?.advancement.hasTie"></TieResolution>
      <!--<TieResolution v-if="liveStore.roundResult?.advancement.hasTie"></TieResolution>-->
      <div class="" v-if="!liveStore.roundResult?.canAdvance && advanceReasonText">
        <span class="font-medium text-red-600/70">
          {{ advanceReasonText }}
        </span>
      </div>
      <div
        v-if="liveStore.roundResult?.nextRound"
        class="flex w-full items-center justify-end px-4"
      >
        <button
          :hidden="liveStore.roundResult.isCompleted"
          :disabled="
            !liveStore.roundResult?.allJudgesSubmitted ||
            liveStore.roundResult?.advancement.hasTie ||
            !liveStore.roundResult.canAdvance
          "
          class="bg-jungle-green-800 hover:bg-jungle-green-900 disabled:bg-jungle-green-800/50 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white disabled:cursor-not-allowed sm:h-15 sm:text-base"
        >
          Advance to {{ liveStore.roundResult?.nextRound?.name }}
        </button>
      </div>

      <div
        v-else-if="liveStore.roundResult?.canDeclareWinners"
        class="flex w-full items-center justify-end px-4"
      >
        <button
          :disabled="!liveStore.roundResult.canAdvance"
          class="bg-jungle-green-800 hover:bg-jungle-green-900 disabled:bg-jungle-green-800/50 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white disabled:cursor-not-allowed sm:h-15 sm:text-base"
        >
          Declare Winners
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import JudgeSubmissions from '@/components/admin/live_event/judgeSubmissions.vue';
import RankingsContestant from '@/components/admin/live_event/rankingsContestant.vue';
import TieResolution from '@/components/admin/live_event/tieResolution.vue';
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const roundStore = useRoundStore();
const liveStore = useLiveStore();

const activeRoundId = computed(() => {
  const id = route.params.roundId;
  return id ? Number(id) : null;
});

const currentRound = computed(() => roundStore.roundList.find((r) => r.id === activeRoundId.value));

const fetchRounds = async (roundId: number) => {
  try {
    await liveStore.getJudgeSubmissionsId(roundId);
    await liveStore.getRoundResults(roundId);
  } catch (error) {
    console.log(error);
  }
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
    if (newId) {
      fetchRounds(newId);
    }
  },
  { immediate: true },
);
</script>
