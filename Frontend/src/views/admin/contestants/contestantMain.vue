<script setup lang="ts">
import ContestantTable from '@/components/admin/contestants/ContestantTable.vue';
import BasePanel from '@/components/shared/BasePanel.vue';
import BaseEmptyState from '@/components/shared/BaseEmptyState.vue';
import ContestantAddModal from '@/components/admin/contestants/ContestantAddModal.vue';
import { useModalStore } from '@/stores/modals/modalStore';
import ContestantEditModal from '@/components/admin/contestants/ContestantEditModal.vue';
import { computed, ref, watch } from 'vue';
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import { useRoute, useRouter } from 'vue-router';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { Users } from '@lucide/vue';

const modalStore = useModalStore();
const route = useRoute();
const router = useRouter();
const selectedContestantid = ref(0);
const contestantStore = useContestantStore();

const selectedGenderFilter = ref<Gender | undefined>(undefined);

interface FilterButtons {
  label: string;
  value: Gender | undefined;
}

const genderFilterButtons: FilterButtons[] = [
  { label: 'All', value: undefined },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const setSelectedGenderFilter = (filter: Gender | undefined) => {
  selectedGenderFilter.value = filter;
  router.replace({ query: { filter } });
};

const retryFetchContestants = async () => {
  await contestantStore.getContestants(selectedGenderFilter.value);
};

const openEditContestant = (id: number) => {
  localStorage.setItem('contestant-id', JSON.stringify(id));
  selectedContestantid.value = id;
  modalStore.toggleEditContestant();
};

const handleDelete = async (id: number) => {
  await contestantStore.deleteContestant(id);
};

const hasActiveFilter = computed(() => selectedGenderFilter.value !== undefined);

watch(
  () => route.query.filter,
  async (newFilter) => {
    const filterValue = (newFilter as Gender) || undefined;
    if (
      filterValue &&
      filterValue.toLowerCase() !== 'male' &&
      filterValue.toLowerCase() !== 'female'
    ) {
      selectedGenderFilter.value = undefined;
      router.replace({ query: { filter: undefined } });
    } else {
      selectedGenderFilter.value = filterValue;
    }
    await contestantStore.getContestants(selectedGenderFilter.value);
  },
  { immediate: true },
);
</script>

<template>
  <ContestantAddModal
    :showModal="modalStore.contestantModalStates.isAddContestantVisible"
    :selectedGenderFilter
  ></ContestantAddModal>
  <ContestantEditModal
    :showModal="modalStore.contestantModalStates.isEditContestantVisible"
    :contestantId="selectedContestantid"
  ></ContestantEditModal>
  <BasePanel
    title="Contestant Management"
    addButtonLabel="Add Contestant"
    :isLoading="contestantStore.loadingStates.isFetchingContestantList"
    :isError="contestantStore.errorStates.isFetchingContestantListError"
    errorTitle="Failed to Load Contestants"
    errorDescription="We couldn't load the contestants. Please try again."
    :onRetry="retryFetchContestants"
    @add="modalStore.toggleAddContestant()"
  >
    <template #toolbar>
      <div
        class="flex w-full gap-4 self-start"
        v-if="contestantStore.contestantList.length > 0 || hasActiveFilter"
      >
        <button
          v-for="button in genderFilterButtons"
          :key="button.label"
          :class="{ 'bg-main-dark-brown text-white': selectedGenderFilter === button.value }"
          @click="setSelectedGenderFilter(button.value)"
          class="w-full cursor-pointer rounded-md border border-black/40 px-2 py-2 md:w-fit md:px-6"
        >
          {{ button.label }}
        </button>
      </div>
    </template>
    <BaseEmptyState
      v-if="contestantStore.contestantList.length === 0 && hasActiveFilter"
      :icon="Users"
      title="No contestants match this filter"
      description="Try a different filter or clear it to see all contestants."
      actionLabel="Clear Filter"
      @action="setSelectedGenderFilter(undefined)"
    />
    <BaseEmptyState
      v-else-if="contestantStore.contestantList.length === 0"
      :icon="Users"
      title="No contestants yet"
      description="Add your first contestant to get started."
      actionLabel="Add Contestant"
      @action="modalStore.toggleAddContestant()"
    />
    <ContestantTable
      v-else
      :items="contestantStore.contestantList"
      @edit="openEditContestant"
      @delete="handleDelete"
    ></ContestantTable>
  </BasePanel>
</template>
