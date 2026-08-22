<template>
  <div
    @click.self="modalStore.toggleAddRoundsModal()"
    v-if="props.showModal"
    class="font-poppins fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4 sm:p-0"
  >
    <div class="flex flex-col items-center rounded-xl bg-amber-200 sm:w-lg">
      <div class="flex w-full justify-between p-4 text-2xl">
        <p class="">Add Rounds</p>
      </div>

      <div class="flex w-full flex-col justify-center gap-4 p-4">
        <div class="w-full">
          <p>Rounds Name</p>
          <input
            @input="clearError"
            v-model="newRoundsName"
            type="text"
            name=""
            id=""
            class="h-10 w-full flex-1 border border-black"
          />

          <div v-if="roundStore.isRoundNameInvalid" class="mt-1 flex h-full w-full justify-start">
            <p class="flex gap-1 px-1 text-sm text-red-500 sm:gap-2 sm:text-base">
              <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert
              >{{ roundStore.isRoundNameInvalid }}
            </p>
          </div>
        </div>

        <div class="w-full">
          <p>Phase Order</p>
          <input
            @input="clearError"
            v-model="newRoundsPhase"
            type="number"
            name=""
            id=""
            class="h-10 w-full border border-black"
          />

          <div v-if="roundStore.isRoundPhaseInvalid" class="mt-1 flex h-full w-full justify-start">
            <p class="flex gap-1 px-1 text-sm text-red-500 sm:gap-2 sm:text-base">
              <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert
              >{{ roundStore.isRoundPhaseInvalid }}
            </p>
          </div>
        </div>

        <div class="w-full">
          <p>Contestant Limit</p>
          <input
            @input="clearError"
            :readonly="newRoundsPhase === 1"
            v-model="newRoundsLimit"
            type="number"
            name=""
            id=""
            class="h-10 w-full border border-black"
          />
          <div v-if="roundStore.isRoundLimitInvalid" class="mt-1 flex h-full w-full justify-start">
            <p class="flex gap-1 px-1 text-sm text-red-500 sm:gap-2 sm:text-base">
              <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert
              >{{ roundStore.isRoundLimitInvalid }}
            </p>
          </div>
        </div>
      </div>

      <div class="m-4 flex w-full items-start justify-center gap-4">
        <button @click="modalStore.toggleAddRoundsModal()" class="border border-black p-4">
          Cancel
        </button>
        <button @click="addRounds()" class="border border-black p-4">Add Rounds</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { ref } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/roundStore';
import type { AddRoundInput } from '@/types/admin/adminSetup/rounds';
import { CircleAlert } from '@lucide/vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const props = defineProps<{
  showModal: boolean;
}>();

const newRoundsName = ref('');
const newRoundsPhase = ref(0);
const newRoundsLimit = ref(null);

const clearError = () => {
  if (roundStore.isRoundNameInvalid) {
    roundStore.isRoundNameInvalid = '';
  } else if (roundStore.isRoundPhaseInvalid) {
    roundStore.isRoundPhaseInvalid = '';
  } else if (roundStore.isRoundLimitInvalid) {
    roundStore.isRoundLimitInvalid = '';
  }
};
const addRounds = () => {
  /*if (newRoundsName.value === '' || newRoundsPhase.value === 0 || newRoundsLimit.value === 0) {
    return;
  }*/

  const rounds: AddRoundInput = {
    name: newRoundsName.value,
    phaseOrder: newRoundsPhase.value,
    contestantLimit: newRoundsLimit.value,
  };

  roundStore.addRound(rounds);

  newRoundsName.value = '';
  newRoundsPhase.value = 0;
  newRoundsLimit.value = null;
};
</script>
