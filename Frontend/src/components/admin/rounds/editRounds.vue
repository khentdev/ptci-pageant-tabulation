<template>
  <BaseModal
    :showModal="props.showModal"
    title="Edit Rounds"
    @close="modalStore.toggleEditRoundsModal()"
  >
    <ModalFetchOverlay v-if="roundStore.loadingStates.isFetchingRoundById" />
    <ServerErrorOverlayModal
      v-else-if="roundStore.errorStates.isFetchingRoundByIdError"
      title="Failed to Load Round Details"
      description="We couldn't load the round details. Please try again."
      :onRetry="retryFetchRoundById"
    />
    <form
      v-else
      @submit.prevent="editRound()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="flex flex-col">
        <p>Rounds Name</p>
        <input
          v-model="newRoundName"
          type="text"
          name="roundName"
          id="roundName"
          class="h-10 w-full border border-black px-3"
        />
        <div v-if="roundStore.formErrors.roundName" class="mt-1 flex w-full items-start gap-1">
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18"></CircleAlert>
          <p class="text-sm text-red-500">
            {{ roundStore.formErrors.roundName }}
          </p>
        </div>
      </div>

      <div class="flex flex-col">
        <p>Phase Order</p>
        <input
          :value="roundStore.roundId?.phaseOrder"
          readonly
          type="text"
          name="phaseOrder"
          id="phaseOrder"
          placeholder="Loading..."
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
        />
      </div>

      <div v-if="roundStore.roundId?.phaseOrder !== 1" class="flex flex-col">
        <p>Contestant Limit</p>
        <input
          :value="newRoundLimit"
          @input="onLimitInput"
          :readonly="roundStore.roundId?.isLimitLocked"
          type="text"
          placeholder="e.g. 10"
          name="contestantLimit"
          id="contestantLimit"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
        />
        <div v-if="roundStore.formErrors.roundLimit" class="mt-1 flex w-full items-start gap-1">
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18"></CircleAlert>
          <p class="text-sm text-red-500">
            {{ roundStore.formErrors.roundLimit }}
          </p>
        </div>
      </div>

      <BaseModalActions
        submitLabel="Save Changes"
        submittingLabel="Saving..."
        :isSubmitting="roundStore.loadingStates.isEditingRound"
        :disabled="!roundStore.roundId"
        @cancel="modalStore.toggleEditRoundsModal()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore.ts';
import { ref, watch } from 'vue';
import type { EditRoundInput } from '@/types/admin/adminSetup/rounds/rounds';
import { CircleAlert } from '@lucide/vue';
import { useToast } from '@/composables/Toast/useToast';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';
import ModalFetchOverlay from '@/components/shared/modal/ModalFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const { toast } = useToast();
const props = defineProps<{
  showModal: boolean;
}>();

const newRoundName = ref('');
const newRoundLimit = ref('');

const retryFetchRoundById = async () => {
  const rawRoundId = localStorage.getItem('round-id');
  if (rawRoundId === null) {
    return;
  }

  const id = Number(JSON.parse(rawRoundId));
  if (Number.isNaN(id)) {
    return;
  }

  await roundStore.getRoundId(id);
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const populateForm = () => {
  const round = roundStore.roundId;
  if (!round) {
    return;
  }

  newRoundName.value = round.name;
  newRoundLimit.value =
    round.contestantLimit !== null && round.contestantLimit !== undefined
      ? String(round.contestantLimit)
      : '';
};

const getContestantLimitForSubmit = (): number | null => {
  const round = roundStore.roundId;
  if (!round || round.phaseOrder === 1) {
    return null;
  }
  if (round.isLimitLocked) {
    return round.contestantLimit;
  }

  return newRoundLimit.value === '' ? null : Number(newRoundLimit.value);
};

const validateContestantLimit = (): boolean => {
  const round = roundStore.roundId;
  if (!round || round.phaseOrder === 1 || round.isLimitLocked) {
    return true;
  }

  if (newRoundLimit.value === '') {
    roundStore.formErrors.roundLimit =
      'Contestant limit is required for rounds after the preliminary round.';
    return false;
  }

  const limit = Number(newRoundLimit.value);
  if (!Number.isInteger(limit) || limit <= 0) {
    roundStore.formErrors.roundLimit = 'Contestant limit must be a positive whole number.';
    return false;
  }

  return true;
};

const hasChanges = (): boolean => {
  const round = roundStore.roundId;
  if (!round) {
    return false;
  }

  const nameChanged = newRoundName.value.trim() !== round.name;
  if (round.phaseOrder === 1 || round.isLimitLocked) {
    return nameChanged;
  }

  const submittedLimit = getContestantLimitForSubmit();
  return nameChanged || submittedLimit !== round.contestantLimit;
};

const onLimitInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const cleaned = digitsOnly(target.value);
  target.value = cleaned;
  newRoundLimit.value = cleaned;
};

const editRound = async () => {
  if (!hasChanges()) {
    toast.info('No changes detected.');
    return;
  }

  if (!validateContestantLimit()) {
    return;
  }

  const rawRoundId = localStorage.getItem('round-id');
  const storedRoundId = rawRoundId !== null ? Number(JSON.parse(rawRoundId)) : 0;

  const round: EditRoundInput = {
    id: storedRoundId,
    name: newRoundName.value.trim(),
    contestantLimit: getContestantLimitForSubmit(),
  };

  const success = await roundStore.editRound(round);
  if (success) {
    modalStore.toggleEditRoundsModal();
    newRoundName.value = '';
    newRoundLimit.value = '';
  }
};

watch(
  () => [props.showModal, roundStore.roundId] as const,
  ([isOpen]) => {
    if (isOpen) {
      populateForm();
    }
  },
);

watch([newRoundName, newRoundLimit], () => {
  roundStore.clearFormErrors();
});
</script>
