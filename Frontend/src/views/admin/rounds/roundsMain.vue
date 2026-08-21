<script setup lang="ts">
import RoundsTable from '@/components/admin/rounds/roundsTable.vue';
import { Plus } from '@lucide/vue';
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/roundStore';
const modalStore = useModalStore();
const roundStore = useRoundStore();


</script>

<template>
  <div
    class="bg-main-light-brown font-poppins flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Round Management</p>
      <button
        @click="modalStore.toggleAddRoundsModal()"
        class="bg-jungle-green-800 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Rounds
      </button>
    </div>

    <div class="flex h-full w-full">
      <table class="w-full table-fixed">
        <thead class="rounded-xl">
          <tr class="bg-main-dark-brown text-sm text-white sm:h-20 sm:text-xl">
            <th>Name</th>
            <th>Phase Order</th>
            <th>Contestant Limit</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <RoundsTable></RoundsTable>
        </tbody>
      </table>
    </div>
  </div>
</template>
