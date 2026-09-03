<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import BasePanel from '@/components/shared/BasePanel.vue';
import { onMounted } from 'vue';
import JudgeTable from '@/components/admin/judge/judgeTable.vue';
import { useJudgeStore } from '@/stores/admin/adminSetup/judge/judgeStore';
import AddJudge from '@/components/admin/judge/addJudge.vue';
import EditJudge from '@/components/admin/judge/editJudge.vue';
import { ref } from 'vue';
import ResetPassword from '@/components/admin/judge/resetPassword.vue';

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
  <AddJudge :showModal="modalStore.judgeModalStates.isAddingJudgeVisible"></AddJudge>
  <EditJudge
    :showModal="modalStore.judgeModalStates.isEditJudgeVisible"
    :judgeId="selectedJudgeId"
  ></EditJudge>
  <ResetPassword
    :showModal="modalStore.judgeModalStates.isResetPasswordJudgeVisible"
    :judgeId="selectedJudgeId"
  ></ResetPassword>
  <BasePanel
    title="Judge Management"
    addButtonLabel="Add Judge"
    :isLoading="judgeStore.loadingStates.isFetchingJudgeList"
    :isError="judgeStore.errorStates.isFetchingJudgeListError"
    errorTitle="Failed to Load Judges"
    errorDescription="We couldn't load the judges. Please try again."
    :onRetry="judgeStore.getJudgesList"
    @add="modalStore.judgesModalFunction().toggleAddingJudgesModal()"
  >
    <JudgeTable
      :items="judgeStore.judgeList"
      @edit="openEditJudge"
      @delete="handleDelete"
      @resetPassword="openResetPassJudge"
    ></JudgeTable>
  </BasePanel>
</template>
