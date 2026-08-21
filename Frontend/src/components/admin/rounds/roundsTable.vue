<template>
  <tr class="font-poppins" v-for="item in roundStore.roundList" :key="item.id">
    <td class="border px-2">{{ item.name }}</td>
    <td class="border px-2">{{ item.phaseOrder }}</td>
    <td class="border px-2">{{ item.contestantLimit }}</td>
    <td class="w-full border px-2">
      <div class="flex">
        <button @click="editRound(item.id)" class="w-full bg-amber-300">Edit</button
        ><button @click="deleteRound(item.id)" class="w-full bg-amber-600">Delete</button>
      </div>
    </td>
  </tr>
</template>
<script setup lang="ts">
import { useRoundStore } from '@/stores/admin/adminSetup/roundStore';
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted, onUnmounted } from 'vue';

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
