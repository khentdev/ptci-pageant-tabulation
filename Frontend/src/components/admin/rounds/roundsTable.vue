<template>
  <tr class="font-poppins" v-for="item in roundStore.roundList" :key="item.id">
    <td class="border px-2 text-nowrap">{{ item.name }}</td>
    <td class="border px-2 text-nowrap">{{ item.phaseOrder }}</td>
    <td class="border px-2 text-nowrap">{{ item.contestantLimit }}</td>
    <td class="border px-2">
      <div class="flex h-12 items-center justify-center gap-4">
        <button
          @click="editRound(item.id)"
          class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 text-black hover:bg-amber-400"
        >
          Edit</button
        ><button
          @click="deleteRound(item.id)"
          class="h-10 cursor-pointer rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
</template>
<script setup lang="ts">
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { useModalStore } from '@/stores/modals/modalStore';

const modalStore = useModalStore();
const roundStore = useRoundStore();

const editRound = async (id: number) => {
  localStorage.setItem('round-id', JSON.stringify(id));
  modalStore.toggleEditRoundsModal();
  await roundStore.getRoundId(id);
};

const deleteRound = async (id: number) => {
  roundStore.deleteRound(id);
};
</script>
