<template>
  <tr class="font-poppins" v-for="item in roundStore.roundList" :key="item.id">
    <td class="border px-2 text-nowrap">{{ item.name }}</td>
    <td class="border px-2 text-nowrap">{{ item.phaseOrder }}</td>
    <td class="border px-2 text-nowrap">{{ item.contestantLimit }}</td>
    <td class="border px-2">
      <div class="flex items-center justify-center gap-4 h-12">
        <button @click="editRound(item.id)" class="px-6 h-10 rounded-xl bg-amber-300 hover:bg-amber-400 text-black cursor-pointer">Edit</button
        ><button @click="deleteRound(item.id)" class="px-6 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">Delete</button>
      </div>
    </td>
  </tr>
</template>
<script setup lang="ts">
import { useRoundStore } from '@/stores/admin/adminSetup/roundStore';
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted } from 'vue';

const modalStore = useModalStore();
const roundStore = useRoundStore();

const editRound = async (id: number) => {
  modalStore.toggleEditRoundsModal();
  roundStore.getRoundId(id);
  localStorage.setItem('round-id', JSON.stringify(id));
};

const deleteRound = async (id: number) => {
  roundStore.deleteRound(id);
};

onMounted(async () => {
  await roundStore.getRound();
});
</script>
