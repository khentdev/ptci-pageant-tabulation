<template>
  <BaseModal
    :showModal="props.showModal"
    title="Edit Contestant"
    @close="modalStore.toggleEditContestant()"
  >
    <ModalFetchOverlay v-if="contestantStore.loadingStates.isFetchingContestantId" />
    <ServerErrorOverlayModal
      v-else-if="contestantStore.errorStates.isFetchingContestantIdError"
      title="Failed to Load Contestant Details"
      description="We couldn't load the contestant details. Please try again."
      :onRetry="retryFetchContestantById"
    />
    <form
      v-else
      @submit.prevent="saveContestant()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="h-full w-full">
        <p>Contestant No.</p>
        <input
          v-model="newContestantNumber"
          :readonly="contestant?.isLocked"
          type="text"
          inputmode="numeric"
          placeholder="e.g. 1"
          name="contestantNumber"
          id="contestantNumber"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
        />
        <div
          v-if="contestantStore.formErrors.contestantNumber"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ contestantStore.formErrors.contestantNumber }}
          </p>
        </div>
      </div>

      <div class="h-full w-full">
        <p>Name</p>
        <input
          v-model="newContestantName"
          :readonly="contestant?.isLocked === true"
          type="text"
          placeholder="e.g. Dela Cruz, Juan"
          name="contestantName"
          id="contestantName"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
        />
        <div
          v-if="contestantStore.formErrors.contestantName"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ contestantStore.formErrors.contestantName }}
          </p>
        </div>
      </div>

      <div class="h-full w-full">
        <p>Gender</p>
        <select
          v-model="selectedGender"
          class="h-10 w-full border border-black px-3 disabled:cursor-not-allowed disabled:bg-gray-300"
          :disabled="contestant?.isLocked === true"
        >
          <option :value="undefined" disabled>Select a gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <div
          v-if="contestantStore.formErrors.contestantGender"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ contestantStore.formErrors.contestantGender }}
          </p>
        </div>
      </div>

      <div class="h-full w-full">
        <p>Team Name</p>
        <input
          v-model="newContestantTeamName"
          :readonly="contestant?.isLocked === true"
          type="text"
          placeholder="e.g. Yellow Team"
          name="contestantTeamName"
          id="contestantTeamName"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
        />
        <div
          v-if="contestantStore.formErrors.contestantTeamName"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ contestantStore.formErrors.contestantTeamName }}
          </p>
        </div>
      </div>

      <div class="h-full w-full">
        <p>Team Color</p>
        <input
          v-model="newContestantTeamColor"
          :readonly="contestant?.isLocked === true"
          type="text"
          placeholder="e.g. Yellow"
          name="contestantTeamColor"
          id="contestantTeamColor"
          class="h-10 w-full border border-black px-3 read-only:cursor-not-allowed read-only:bg-gray-300"
        />
        <div
          v-if="contestantStore.formErrors.contestantTeamColor"
          class="mt-1 flex w-full items-start gap-1"
        >
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18" />
          <p class="text-sm text-red-500">
            {{ contestantStore.formErrors.contestantTeamColor }}
          </p>
        </div>
      </div>

      <BaseModalActions
        submitLabel="Save Changes"
        submittingLabel="Saving changes..."
        :isSubmitting="contestantStore.loadingStates.isEditingContestants"
        :disabled="contestant?.isLocked === true"
        @cancel="modalStore.toggleEditContestant()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import { useModalStore } from '@/stores/modals/modalStore';
import { type GetContestantByIdDTO } from '@/types/admin/adminSetup/contestants/contestants';
import type { EditContestantInput, Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { CircleAlert } from '@lucide/vue';
import { ref, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';
import ModalFetchOverlay from '@/components/shared/modal/ModalFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';
import { useToast } from '@/composables/Toast/useToast';

const contestantStore = useContestantStore();
const { toast } = useToast();
const modalStore = useModalStore();

const newContestantNumber = ref('');
const newContestantName = ref('');
const selectedGender = ref<Gender | undefined>(undefined);
const newContestantTeamName = ref('');
const newContestantTeamColor = ref('');
const contestant = ref<GetContestantByIdDTO | null>(null);
const props = defineProps<{
  showModal: boolean;
  contestantId: number;
}>();
const saveContestant = async () => {
  if (!hasChanges()) {
    toast.info('No changes detected.');
    return;
  }

  const payload: EditContestantInput = {
    id: contestant.value?.id!,
    candidateNumber: String(newContestantNumber.value),
    name: newContestantName.value.trim(),
    gender: selectedGender.value!,
    teamName: newContestantTeamName.value.trim(),
    teamColor: newContestantTeamColor.value.trim(),
  };

  const success = await contestantStore.editContestant(payload);
  if (success) {
    modalStore.toggleEditContestant();
    newContestantNumber.value = '';
    selectedGender.value = undefined;
    newContestantName.value = '';
    newContestantTeamName.value = '';
    newContestantTeamColor.value = '';
  }
};

watch(
  [newContestantNumber, newContestantName, newContestantTeamName, newContestantTeamColor],
  () => {
    contestantStore.clearFormErrors();
  },
);

const digitsOnly = (value: string) => value.replace(/\D/g, '');

watch(newContestantNumber, (value) => {
  const cleaned = digitsOnly(value);
  if (cleaned !== value) {
    newContestantNumber.value = cleaned;
  }
});

const hasChanges = () => {
  if (!contestant.value) {
    return false;
  }
  return (
    selectedGender.value !== contestant.value?.gender ||
    newContestantName.value !== contestant.value?.name ||
    newContestantNumber.value !== String(contestant.value?.candidateNumber) ||
    newContestantTeamName.value !== contestant.value?.teamName ||
    newContestantTeamColor.value !== contestant.value?.teamColor
  );
};

const loadContestant = async () => {
  if (!props.contestantId) {
    return;
  }

  contestantStore.clearFormErrors();
  const fetchedContestant = await contestantStore.getContestantsId(props.contestantId);
  contestant.value = fetchedContestant;

  if (fetchedContestant) {
    newContestantNumber.value = String(fetchedContestant.candidateNumber);
    newContestantName.value = fetchedContestant.name;
    selectedGender.value = fetchedContestant.gender as Gender;
    newContestantTeamName.value = fetchedContestant.teamName;
    newContestantTeamColor.value = fetchedContestant.teamColor;
  }
};

const retryFetchContestantById = async () => {
  await loadContestant();
};

watch(
  () => [props.showModal, props.contestantId] as const,
  ([isOpen]) => {
    if (isOpen) {
      void loadContestant();
    }
  },
  { immediate: true },
);
</script>
