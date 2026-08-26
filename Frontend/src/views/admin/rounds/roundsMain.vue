<script setup lang="ts">
import RoundsTable from '@/components/admin/rounds/roundsTable.vue';
import { Plus } from '@lucide/vue';
import { useModalStore } from '@/stores/modals/modalStore';
import AddRounds from '@/components/admin/rounds/addRounds.vue';
import EditRounds from '@/components/admin/rounds/editRounds.vue';
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
<<<<<<< HEAD
import { useRoundStore } from '@/stores/admin/adminSetup/round/roundStore';
=======
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
>>>>>>> d807c4d3479698ae07c3cc4dbd0a88bb0d8f4953
import { onMounted } from 'vue';
import ServerErrorOverlay from '@/components/shared/ServerErrorOverlay.vue';

const modalStore = useModalStore();
const roundStore = useRoundStore();

onMounted(() => {
  roundStore.getRound();
});
</script>

<template>
  <AddRounds :showModal="modalStore.isAddRoundsVisible"></AddRounds>
  <EditRounds :showModal="modalStore.isEditRoundsVisible"></EditRounds>
  <BaseFetchOverlay v-if="roundStore.loadingStates.isFetchingRounds" />
  <ServerErrorOverlay
  v-else-if="roundStore.errorStates.isFetchingRoundsError"
    title="Failed to Load Rounds"
    description="We couldn't load the rounds. Please try again."
    :onRetry="roundStore.getRound"
  />
  <div
    v-else
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Round Management</p>

      <button
        @click="modalStore.toggleAddRoundsModal()"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Rounds
      </button>
    </div>

    <div class="relative w-full overflow-y-auto md:h-[calc(100dvh-100px)]">
      <table class="w-full">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="px-4 text-nowrap">Name</th>
            <th class="px-4 text-nowrap">Phase Order</th>
            <th class="px-4 text-nowrap">Contestant Limit</th>
            <th class="px-4">Action</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <RoundsTable></RoundsTable>
        </tbody>
      </table>
    </div>
  </div>
</template>
