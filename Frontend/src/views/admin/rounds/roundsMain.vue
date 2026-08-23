<script setup lang="ts">
import RoundsTable from '@/components/admin/rounds/roundsTable.vue';
import { Plus } from '@lucide/vue';
import { useModalStore } from '@/stores/modals/modalStore';
import AddRounds from '@/components/admin/rounds/addRounds.vue';
import EditRounds from '@/components/admin/rounds/editRounds.vue';
const modalStore = useModalStore();
</script>

<template>

<AddRounds :showModal="modalStore.isAddRoundsVisible"></AddRounds>
<EditRounds :showModal="modalStore.isEditRoundsVisible"></EditRounds>
  <div
    class="bg-main-light-brown font-poppins flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Round Management</p>
      
   
      <button
        @click="modalStore.toggleAddRoundsModal()"
        class="bg-jungle-green-800 flex h-10 items-center gap-2 rounded-xl p-4 hover:bg-jungle-green-900 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Rounds
      </button>
    </div>

    <div class="md:h-[calc(100dvh-100px)]  w-full overflow-y-auto">
  <table class="relative w-full">
        <thead class="rounded-xl sticky top-0 z-20 h-full">
          <tr class="bg-main-dark-brown text-sm text-left h-10 text-white sm:h-20 sm:text-xl">
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
