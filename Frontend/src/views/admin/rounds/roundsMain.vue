<script setup lang="ts">
import RoundsTable from '@/components/admin/rounds/roundsTable.vue';
import { useModalStore } from '@/stores/modals/modalStore';
import AddRounds from '@/components/admin/rounds/addRounds.vue';
import EditRounds from '@/components/admin/rounds/editRounds.vue';
import BasePanel from '@/components/shared/BasePanel.vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { onMounted } from 'vue';

const modalStore = useModalStore();
const roundStore = useRoundStore();

onMounted(async () => {
  await roundStore.getRound();
});

const handleEdit = async (id: number) => {
  localStorage.setItem('round-id', JSON.stringify(id));
  modalStore.toggleEditRoundsModal();
  await roundStore.getRoundId(id);
};

const handleDelete = async (id: number) => {
  await roundStore.deleteRound(id);
};
</script>

<template>
  <AddRounds :showModal="modalStore.isAddRoundsVisible"></AddRounds>
  <EditRounds :showModal="modalStore.isEditRoundsVisible"></EditRounds>
  <BasePanel
    title="Round Management"
    addButtonLabel="Add Rounds"
    :isLoading="roundStore.loadingStates.isFetchingRounds"
    :isError="roundStore.errorStates.isFetchingRoundsError"
    errorTitle="Failed to Load Rounds"
    errorDescription="We couldn't load the rounds. Please try again."
    :onRetry="roundStore.getRound"
    @add="modalStore.toggleAddRoundsModal()"
  >
    <RoundsTable
      :items="roundStore.roundList"
      @edit="handleEdit"
      @delete="handleDelete"
    ></RoundsTable>
  </BasePanel>
</template>
