<template>
  <BaseModal
    :showModal="props.showModal"
    title="Add Rounds"
    @close="modalStore.toggleAddRoundsModal()"
  >
    <form
      @submit.prevent="addRounds()"
      class="flex h-full w-full flex-col justify-start gap-4 p-4"
    >
      <div class="flex flex-col">
        <p>Rounds Name</p>
        <input
          v-model="newRoundsName"
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
          v-model="newRoundsPhase"
          @input="onPhaseInput"
          type="text"
          name="phaseOrder"
          id="phaseOrder"
          placeholder="e.g. 1 for the first (preliminary) phase"
          class="h-10 w-full border border-black px-3"
        />
        <div v-if="roundStore.formErrors.roundPhase" class="mt-1 flex w-full items-start gap-1">
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18"></CircleAlert>
          <p class="text-sm text-red-500">
            {{ roundStore.formErrors.roundPhase }}
          </p>
        </div>
      </div>
      <div class="flex flex-col">
        <p>Contestant Limit</p>
        <input
          v-model="newRoundsLimit"
          @input="onLimitInput"
          type="text"
          placeholder="Leave empty for no limit"
          name="contestantLimit"
          id="contestantLimit"
          class="h-10 w-full border border-black px-3"
        />
        <div v-if="roundStore.formErrors.roundLimit" class="mt-1 flex w-full items-start gap-1">
          <CircleAlert class="shrink-0 stroke-red-500 stroke-2" :size="18"></CircleAlert>
          <p class="text-sm text-red-500">
            {{ roundStore.formErrors.roundLimit }}
          </p>
        </div>
      </div>
      <BaseModalActions
        submitLabel="Add Rounds"
        submittingLabel="Adding round..."
        :isSubmitting="roundStore.loadingStates.isAddingRound"
        @cancel="modalStore.toggleAddRoundsModal()"
      />
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { ref, watch } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import type { AddRoundInput } from '@/types/admin/adminSetup/rounds/rounds';
import { CircleAlert } from '@lucide/vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import BaseModalActions from '@/components/shared/BaseModalActions.vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const props = defineProps<{
  showModal: boolean;
}>();

const newRoundsName = ref('');
const newRoundsPhase = ref('');
const newRoundsLimit = ref('');

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const onPhaseInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  newRoundsPhase.value = digitsOnly(target.value);
};

const onLimitInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  newRoundsLimit.value = digitsOnly(target.value);
};

const addRounds = async () => {
  const rounds: AddRoundInput = {
    name: newRoundsName.value,
    phaseOrder: Number(newRoundsPhase.value),
    contestantLimit: newRoundsLimit.value === '' ? null : Number(newRoundsLimit.value),
  };

  const success = await roundStore.addRound(rounds);
  if (success) {
    modalStore.toggleAddRoundsModal();
    newRoundsName.value = '';
    newRoundsPhase.value = '';
    newRoundsLimit.value = '';
  }
};

watch([newRoundsName, newRoundsPhase, newRoundsLimit], () => {
  roundStore.clearFormErrors();
});
</script>
