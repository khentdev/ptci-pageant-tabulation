<template>
  <div
    @click.self="modalStore.toggleEditRoundsModal"
    v-if="props.showModal"
    class="font-poppins fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4 sm:p-0"
  >
    <div class="flex flex-col items-center rounded-xl bg-amber-200 sm:w-lg">
      <div class="flex w-full justify-between p-4 text-2xl">
        <p class="">Edit Rounds</p>
      </div>

      <div class="flex w-full flex-col justify-center gap-4 p-4">
        <div class="w-full">
          <p>Rounds Name</p>
          <input
            @input="clearError"
            v-model="newRoundName"
            :placeholder="`${roundStore.roundId?.name}`"
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
            :placeholder="`${roundStore.roundId?.phaseOrder}`"
            readonly
            type="number"
            name=""
            id=""
            class="h-10 w-full border border-black"
          />
        </div>

        <div class="w-full">
          <p>Contestant Limit</p>
          <input
            @input="clearError"
            v-model="newRoundLimit"
            :readonly="roundStore.roundId?.isLimitLocked || roundStore.roundId?.phaseOrder === 1"
            :placeholder="`${roundStore.roundId?.contestantLimit}`"
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
        <button @click="modalStore.toggleEditRoundsModal" class="border border-black p-4">
          Cancel
        </button>
        <button @click="editRound()" class="border border-black p-4">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { useRoundStore } from '@/stores/admin/adminSetup/roundStore';
import { ref, onUnmounted, onMounted } from 'vue';
import type { EditRoundInput } from '@/types/admin/adminSetup/rounds';
import { CircleAlert } from '@lucide/vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const props = defineProps<{
  showModal: boolean;
}>();

const newRoundName = ref('');
const newRoundLimit = ref(null);

const clearError = () => {
  if (roundStore.isRoundNameInvalid) {
    roundStore.isRoundNameInvalid = '';
  } else if (roundStore.isRoundPhaseInvalid) {
    roundStore.isRoundPhaseInvalid = '';
  } else if (roundStore.isRoundLimitInvalid) {
    roundStore.isRoundLimitInvalid = '';
  }
};

const editRound = async () => {
  /* if (newRoundName.value === '') {
    return;
  }*/

  const rawRoundId = localStorage.getItem('round-id');
  const storedRoundId = rawRoundId !== null ? Number(JSON.parse(rawRoundId)) : 0;

  const round: EditRoundInput = {
    id: storedRoundId,
    name: newRoundName.value,
    contestantLimit: newRoundLimit.value,
  };
  console.log(round);
  roundStore.editRound(round);
  newRoundName.value = '';
  newRoundLimit.value = null;
};
</script>
