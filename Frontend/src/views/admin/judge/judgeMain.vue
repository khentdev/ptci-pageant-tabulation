<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import BasePanel from '@/components/shared/BasePanel.vue';
import BaseEmptyState from '@/components/shared/BaseEmptyState.vue';
import { onMounted } from 'vue';
import JudgeTable from '@/components/admin/judge/JudgeTable.vue';
import { useJudgeStore } from '@/stores/admin/adminSetup/judge/judgeStore';
import JudgeAddModal from '@/components/admin/judge/JudgeAddModal.vue';
import JudgeEditModal from '@/components/admin/judge/JudgeEditModal.vue';
import { ref } from 'vue';
import JudgeResetPasswordModal from '@/components/admin/judge/JudgeResetPasswordModal.vue';
import { Gavel } from '@lucide/vue';

const modalStore = useModalStore();
const judgeStore = useJudgeStore();

const selectedJudgeId = ref(0);

onMounted(async () => {
  await judgeStore.getJudgesList();
});

const openResetPassJudge = (id: number) => {
  selectedJudgeId.value = id;
  modalStore.judgesModalFunction().toggleResetPasswordJudgesModal();
};

const openEditJudge = (id: number) => {
  localStorage.setItem('judge-id', JSON.stringify(id));
  selectedJudgeId.value = id;
  modalStore.judgesModalFunction().toggleEditingJudgesModal();
};

const handleDelete = async (id: number) => {
  await judgeStore.deleteJudge(id);
};
</script>

<template>
  <JudgeAddModal :showModal="modalStore.judgeModalStates.isAddingJudgeVisible"></JudgeAddModal>
  <JudgeEditModal
    :showModal="modalStore.judgeModalStates.isEditJudgeVisible"
    :judgeId="selectedJudgeId"
  ></JudgeEditModal>
  <JudgeResetPasswordModal
    :showModal="modalStore.judgeModalStates.isResetPasswordJudgeVisible"
    :judgeId="selectedJudgeId"
  ></JudgeResetPasswordModal>
  <BasePanel
    title="Judge & Chairman Management"
    addButtonLabel="Add Judge"
    :isLoading="judgeStore.loadingStates.isFetchingJudgeList"
    :isError="judgeStore.errorStates.isFetchingJudgeListError"
    errorTitle="Failed to Load Judges"
    errorDescription="We couldn't load the judges. Please try again."
    :onRetry="judgeStore.getJudgesList"
    @add="modalStore.judgesModalFunction().toggleAddingJudgesModal()"
  >
    <BaseEmptyState
      v-if="judgeStore.judgeList.length === 0"
      :icon="Gavel"
      title="No judges yet"
      description="Add a judge to begin scoring."
      actionLabel="Add Judge"
      @action="modalStore.judgesModalFunction().toggleAddingJudgesModal()"
    />
    <JudgeTable
      v-else
      :items="judgeStore.judgeList"
      @edit="openEditJudge"
      @delete="handleDelete"
      @resetPassword="openResetPassJudge"
    ></JudgeTable>
  </BasePanel>
</template>
