<template>
  <teleport to="body">
    <div
      @click.self="modalStore.toggleEditRoundsModal()"
      v-if="props.showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl bg-amber-200 sm:w-lg md:h-auto"
      >
        <div class="flex w-full items-center justify-between p-4 text-2xl">
          <p class="">Edit Rounds</p>
          <button
            @click="modalStore.toggleEditRoundsModal()"
            class="flex cursor-pointer items-center justify-center rounded-full p-3 hover:bg-black/10"
          >
            <X />
          </button>
        </div>

        <form @submit.prevent="editRound()" class="flex h-full w-full flex-col justify-start gap-4 p-4">
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
              <CircleAlert class="stroke-red-500 stroke-2 shrink-0" :size="18"></CircleAlert>
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
              class="h-10 w-full border border-black px-3 read-only:bg-gray-300 read-only:cursor-not-allowed"
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
              class="h-10 w-full border border-black px-3 read-only:bg-gray-300 read-only:cursor-not-allowed"
            />
            <div v-if="roundStore.formErrors.roundLimit" class="mt-1 flex w-full items-start gap-1">
              <CircleAlert class="stroke-red-500 stroke-2 shrink-0" :size="18"></CircleAlert>
              <p class="text-sm text-red-500">
                {{ roundStore.formErrors.roundLimit }}
              </p>
            </div>
          </div>

          <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
            <button
              type="button"
              @click="modalStore.toggleEditRoundsModal()"
              class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
            >
              Cancel
            </button>
            <button
             type="submit"
              :disabled="roundStore.loadingStates.isEditingRound || !roundStore.roundId"
              class="bg-jungle-green-800 w-full rounded-xl p-4 text-sm text-nowrap text-white hover:bg-jungle-green-900 disabled:opacity-50"
            >
              {{
                roundStore.loadingStates.isEditingRound ? 'Saving...' : 'Save Changes'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { useRoundStore } from '@/stores/admin/adminSetup/roundStore';
import { ref, watch } from 'vue';
import type { EditRoundInput } from '@/types/admin/adminSetup/rounds/rounds';
import { CircleAlert, X } from '@lucide/vue';
import { useToast } from '@/composables/Toast/useToast';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const { toast } = useToast();
const props = defineProps<{
  showModal: boolean;
}>();

const newRoundName = ref('');
const newRoundLimit = ref('');

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
