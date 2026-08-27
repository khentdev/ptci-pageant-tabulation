<template>
  <AddContestant
    :showModal="modalStore.contestantModalStates.isAddContestantVisible"
  ></AddContestant>
  <EditContestant
    :showModal="modalStore.contestantModalStates.isEditContestantVisible"
    :contestantId="selectedContestantid"
  ></EditContestant>
  <div
    class="bg-main-light-brown font-poppins flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Contestant Management</p>
      <button
        @click="modalStore.toggleAddContestant"
        class="bg-jungle-green-800 flex h-10 cursor-pointer items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Contestant
      </button>
    </div>

    <div class="h-full w-full">
      <!--
      <BaseFetchOverlay v-if="contestantStore.loadingStates.isFetchingContestantList" />
      <ServerErrorOverlayModal
        v-else-if="contestantStore.errorStates.isFetchingContestantListError"
        title="Failed to Load Contestants"
        description="We couldn't load the contestants. Please try again."
        :onRetry="contestantStore.getContestants"
      />-->
      <ContestantTable @editContestant="openEditCategory"></ContestantTable>
    </div>
  </div>
</template>
<script setup lang="ts">
import ContestantTable from '@/components/admin/contestants/contestantTable.vue';
import { Plus } from '@lucide/vue';
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import AddContestant from '@/components/admin/contestants/addContestant.vue';
import { useModalStore } from '@/stores/modals/modalStore';
import EditContestant from '@/components/admin/contestants/editContestant.vue';
import { ref } from 'vue';

const contestantStore = useContestantStore();
const modalStore = useModalStore();

const selectedContestantid = ref(0);

const openEditCategory = (id: number) => {
  localStorage.setItem('contestant-id', JSON.stringify(id));
  selectedContestantid.value = id;
  modalStore.toggleEditContestant();
};
</script>
