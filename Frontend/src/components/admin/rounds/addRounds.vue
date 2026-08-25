<template>
  <teleport to="body">
    <div
      @click.self="modalStore.toggleAddRoundsModal()"
      v-if="props.showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl bg-amber-200 sm:w-lg md:h-auto"
      >
        <div class="flex w-full items-center justify-between p-4 text-2xl">
          <p class="">Add Rounds</p>
          <button
            @click="modalStore.toggleAddRoundsModal()"
            class="flex cursor-pointer items-center justify-center rounded-full p-3 hover:bg-black/10"
          >
            <X />
          </button>
        </div>

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
          <div class="mt-auto flex w-full items-center justify-between gap-2 md:gap-4">
            <button
              type="button"
              @click="modalStore.toggleAddRoundsModal()"
              class="w-full rounded-xl border border-black p-4 text-sm hover:bg-black/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="roundStore.loadingStates.isAddingRound"
              class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm text-nowrap text-white disabled:opacity-50"
            >
              {{ roundStore.loadingStates.isAddingRound ? 'Adding round...' : 'Add Rounds' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { ref, watch } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import type { AddRoundInput } from '@/types/admin/adminSetup/rounds/rounds';
import { CircleAlert, X } from '@lucide/vue';

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
