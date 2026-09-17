<script setup lang="ts">
import RoundTable from '@/components/admin/rounds/RoundTable.vue';
import { useModalStore } from '@/stores/modals/modalStore';
import RoundAddModal from '@/components/admin/rounds/RoundAddModal.vue';
import RoundEditModal from '@/components/admin/rounds/RoundEditModal.vue';
import BasePanel from '@/components/shared/BasePanel.vue';
import BaseEmptyState from '@/components/shared/BaseEmptyState.vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { Layers } from '@lucide/vue';
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
  <RoundAddModal :showModal="modalStore.isAddRoundsVisible"></RoundAddModal>
  <RoundEditModal :showModal="modalStore.isEditRoundsVisible"></RoundEditModal>
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
    <BaseEmptyState
      v-if="roundStore.roundList.length === 0"
      :icon="Layers"
      title="No rounds yet"
      description="Create your first round to start organizing the competition."
      actionLabel="Add Rounds"
      @action="modalStore.toggleAddRoundsModal()"
    />
    <RoundTable
      v-else
      :items="roundStore.roundList"
      @edit="handleEdit"
      @delete="handleDelete"
    ></RoundTable>
  </BasePanel>
</template>
