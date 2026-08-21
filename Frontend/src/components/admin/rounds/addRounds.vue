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
            v-model="newRoundsName"
            type="text"
            name=""
            id=""
            class="h-10 w-full flex-1 border border-black"
          />
        </div>

        <div class="w-full">
          <p>Phase Order</p>
          <input
            v-model="newRoundsPhase"
            type="number"
            name=""
            id=""
            class="h-10 w-full border border-black"
          />
        </div>

        <div class="w-full">
          <p>Contestant Limit</p>
          <input
            :readonly="newRoundsPhase === 1"
            v-model="newRoundsLimit"
            type="number"
            name=""
            id=""
            class="h-10 w-full border border-black"
          />
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

const roundStore = useRoundStore();
const modalStore = useModalStore();
const props = defineProps<{
  showModal: boolean;
}>();

const newRoundsName = ref('');
const newRoundsPhase = ref(0);
const newRoundsLimit = ref(null);

const addRounds = () => {
  if (newRoundsName.value === '' || newRoundsPhase.value === 0 || newRoundsLimit.value === 0) {
    return;
  }

  const rounds: AddRoundInput = {
    name: newRoundsName.value,
    phaseOrder: newRoundsPhase.value,
    contestantLimit: newRoundsLimit.value,
  };

  roundStore.addRound(rounds);

  newRoundsName.value = '';
  newRoundsPhase.value = 0;
  newRoundsLimit.value = null;
  modalStore.toggleAddRoundsModal();
};
</script>
