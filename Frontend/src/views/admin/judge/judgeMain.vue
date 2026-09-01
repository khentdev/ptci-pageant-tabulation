<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { useModalStore } from '@/stores/modals/modalStore';
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { onMounted } from 'vue';
import ServerErrorOverlay from '@/components/shared/ServerErrorOverlay.vue';
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

const openEditContestant = (id: number) => {
  localStorage.setItem('judge-id', JSON.stringify(id));
  selectedJudgeId.value = id;
  modalStore.judgesModalFunction().toggleEditingJudgesModal();
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
  <!--<BaseFetchOverlay v-if="roundStore.loadingStates.isFetchingRounds" />
  <ServerErrorOverlay
  v-else-if="roundStore.errorStates.isFetchingRoundsError"
    title="Failed to Load Rounds"
    description="We couldn't load the rounds. Please try again."
    :onRetry="roundStore.getRound"
  />-->
  <div
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Judge Management</p>

      <button
        @click="modalStore.judgesModalFunction().toggleAddingJudgesModal()"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Judge
      </button>
    </div>

    <div class="relative w-full overflow-y-auto md:h-[calc(100dvh-100px)]">
      <JudgeTable @editContestant="openEditContestant" @resetPassJudge="openResetPassJudge">
      </JudgeTable>
    </div>
  </div>
</template>
