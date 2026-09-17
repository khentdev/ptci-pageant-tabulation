<template>
  <BasePanel
    :title="currentRound?.name ?? 'Round Results'"
    :isLoading="liveStore.isFetchingLiveEvent"
    :isError="liveStore.isLiveEventServerError"
    errorTitle="Failed to Load Round Results"
    errorDescription="We couldn't load the round results. Please try again."
    :onRetry="() => fetchRoundResults(activeRoundId ?? 0)"
    :isNotFound="isRoundNotFound"
  >
    <template #not-found>
      <LiveEventNotFoundOverlay />
    </template>

    <LiveEventJudgeSubmissions />
    <div class="" ref="printTarget">
      <LiveEventRankingsTable />
    </div>
    <LiveEventTieResolution v-if="liveStore.roundResult?.advancement.hasTie" />
    <LiveEventPlacementOrderResolution v-if="liveStore.roundResult?.placementTies?.length" />

    <div class="mt-6 flex w-full flex-col gap-3">
      <p
        v-if="!liveStore.roundResult?.canAdvance && advanceReasonText"
        class="flex items-start gap-1.5 text-sm text-black/70"
      >
        <CircleAlert class="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
        {{ advanceReasonText }}
      </p>
      <p
        v-if="roundAction === 'advance-tie' || roundAction === 'declare-tie'"
        class="flex items-start gap-1.5 text-sm text-black/70"
      >
        <CircleAlert class="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
        A tie must be resolved by the Chairman before
        {{ roundAction === 'advance-tie' ? 'advancing' : 'declaring winners' }}.
      </p>

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          v-if="authStore.isAdmin"
          type="button"
          class="max-md:hidden"
          :class="secondaryButtonClass"
          @click="handlePrint"
        >
          <Printer class="size-4 shrink-0" aria-hidden="true" />
          Print
        </button>
        <button
          v-if="roundAction === 'advance' && !liveStore.roundResult?.isCompleted"
          type="button"
          :disabled="!canAdvanceRound || liveStore.loadingStates.isAddingAdvanceRound"
          :class="primaryButtonClass"
          @click="handleAdvanceRound"
        >
          {{
            liveStore.loadingStates.isAddingAdvanceRound
              ? 'Advancing...'
              : `Advance to ${liveStore.roundResult?.nextRound?.name}`
          }}
          <ArrowRight class="size-4 shrink-0" aria-hidden="true" />
        </button>
        <button
          v-else-if="roundAction === 'declare'"
          type="button"
          :disabled="!canDeclareRound || liveStore.loadingStates.isAddingDeclaredWinners"
          :class="primaryButtonClass"
          @click="handleDeclareWinners"
        >
          <Trophy class="size-4 shrink-0" aria-hidden="true" />
          {{ liveStore.loadingStates.isAddingDeclaredWinners ? 'Declaring...' : 'Declare Winners' }}
        </button>
      </div>
    </div>
  </BasePanel>
</template>
<script setup lang="ts">
import LiveEventJudgeSubmissions from '@/components/admin/liveEvent/LiveEventJudgeSubmissions.vue';
import LiveEventNotFoundOverlay from '@/components/admin/liveEvent/LiveEventNotFoundOverlay.vue';
import LiveEventPlacementOrderResolution from '@/components/admin/liveEvent/LiveEventPlacementOrderResolution.vue';
import LiveEventRankingsTable from '@/components/admin/liveEvent/LiveEventRankingsTable.vue';
import LiveEventTieResolution from '@/components/admin/liveEvent/LiveEventTieResolution.vue';
import BasePanel from '@/components/shared/BasePanel.vue';
import { useAuthStore } from '@/stores/auth/authStore';
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import html2canvas from 'html2canvas-pro';
import printJS from 'print-js';
import { ArrowRight, CircleAlert, Printer, Trophy } from '@lucide/vue';

const actionButtonBase =
  'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 sm:w-auto';
const primaryButtonClass = `${actionButtonBase} bg-main-dark-brown text-white enabled:hover:bg-main-dark-brown/80 disabled:cursor-not-allowed disabled:opacity-50`;
const secondaryButtonClass = `${actionButtonBase} border border-black/30 text-black/70 hover:bg-black/5`;

const route = useRoute();
const roundStore = useRoundStore();
const liveStore = useLiveStore();
const authStore = useAuthStore();
const printTarget = ref<HTMLElement | null>(null);

// html2canvas lays out its cloned page at this width, so the printout always uses
// the desktop layout regardless of the current screen size or sidebar state.
const PRINT_LAYOUT_WIDTH = 1280;
const PRINT_MIN_CONTENT_WIDTH = '1024px';

const handlePrint = async (): Promise<void> => {
  if (!printTarget.value) {
    return;
  }

  const canvas = await html2canvas(printTarget.value, {
    scale: 2,
    useCORS: true,
    windowWidth: PRINT_LAYOUT_WIDTH,
    // Capture from the top of the clone; its height differs from the live page,
    // so the current scroll position may not exist there.
    scrollX: 0,
    scrollY: 0,
    onclone: (_clonedDocument, clonedTarget) => {
      // Grow to the tables' full width (many categories) instead of being cropped
      // to the panel's visible width, with a consistent minimum for narrow tables.
      clonedTarget.style.width = 'max-content';
      clonedTarget.style.minWidth = PRINT_MIN_CONTENT_WIDTH;
    },
  });

  const imageDataUrl = canvas.toDataURL('image/png');

  printJS({
    printable: imageDataUrl,
    type: 'image',
    style: `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
      * {
        font-family: 'Poppins', sans-serif !important;
      }`,
    header: `Official Results - ${currentRound.value?.name ?? 'Round'}`,
    headerStyle:
      'font-size: 2rem; font-weight: 600; text-align: center; margin-bottom: 16px; color: #000; font-family: Poppins, sans-serif; ',
    documentTitle: '',
  });
};
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

type RoundAction = 'advance' | 'advance-tie' | 'declare' | 'declare-tie' | null;

// At most one of these applies at a time; checked in priority order so notices
// and buttons can be laid out separately without changing who sees what.
const roundAction = computed<RoundAction>(() => {
  const result = liveStore.roundResult;
  if (!result) {
    return null;
  }
  if (result.nextRound && showAdvanceSection.value) {
    return 'advance';
  }
  if (result.nextRound && authStore.isAdmin && result.advancement.hasTie) {
    return 'advance-tie';
  }
  if (!result.winnersDeclaredAt && showDeclareSection.value) {
    return 'declare';
  }
  if (
    !result.winnersDeclaredAt &&
    authStore.isAdmin &&
    (result.advancement.hasTie || Boolean(result.placementTies?.length))
  ) {
    return 'declare-tie';
  }
  return null;
});

const activeRoundId = computed<number | undefined>(() => {
  const raw = route.params.roundId;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
});

const isRoundIdInvalid = computed(() => activeRoundId.value === undefined);

const isRoundNotFound = computed(() => isRoundIdInvalid.value || liveStore.isLiveEventNotFound);

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
