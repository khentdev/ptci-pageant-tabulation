<template>
  <BaseModal
    :showModal="props.showModal"
    title="Add Contestant"
    @close="modalStore.toggleAddContestant()"
  >
    <form
      @submit.prevent="saveContestant()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="h-full w-full">
        <p>Contestant Number</p>
        <input
          v-model="newContestantNumber"
          type="text"
          inputmode="numeric"
          placeholder="e.g. 1"
          name="contestantNumber"
          id="contestantNumber"
          class="h-10 w-full border border-black px-3"
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
          type="text"
          placeholder="e.g. Dela Cruz, Juan"
          name="contestantName"
          id="contestantName"
          class="h-10 w-full border border-black px-3"
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
        <select v-model="selectedGender" class="h-10 w-full border border-black px-3">
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
          type="text"
          placeholder="e.g. Yellow Team"
          name="contestantTeamName"
          id="contestantTeamName"
          class="h-10 w-full border border-black px-3"
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
          type="text"
          placeholder="e.g. Yellow"
          name="contestantTeamColor"
          id="contestantTeamColor"
          class="h-10 w-full border border-black px-3"
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
        submitLabel="Save Contestant"
        submittingLabel="Saving contestant..."
        :isSubmitting="contestantStore.loadingStates.isAddingContestants"
        @cancel="modalStore.toggleAddContestant()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/Toast/useToast';
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import { useModalStore } from '@/stores/modals/modalStore';
import type { AddContestantInput } from '@/types/admin/adminSetup/contestants/contestants';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { CircleAlert } from '@lucide/vue';
import { ref, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';

const contestantStore = useContestantStore();
const modalStore = useModalStore();
const { toast } = useToast();

const newContestantNumber = ref('');
const newContestantName = ref('');
const selectedGender = ref<Gender | undefined>(undefined);
const newContestantTeamName = ref('');
const newContestantTeamColor = ref('');

const saveContestant = async () => {
  if (!selectedGender.value) {
    toast.error('Please select a gender');
    return;
  }

  const payload: AddContestantInput = {
    candidateNumber: String(newContestantNumber.value),
    name: newContestantName.value.trim(),
    gender: selectedGender.value,
    teamName: newContestantTeamName.value.trim(),
    teamColor: newContestantTeamColor.value.trim(),
  };

  const success = await contestantStore.addContestant(payload);
  if (success) {
    modalStore.toggleAddContestant();
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

const props = defineProps<{
  showModal: boolean;
}>();
</script>
