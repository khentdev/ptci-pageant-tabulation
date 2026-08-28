<template>
  <div class="flex h-full w-full flex-col gap-4">
    <div class="flex gap-4" v-if="!contestantStore.errorStates.isFetchingContestantListError && contestantStore.contestantList.length > 0 && !contestantStore.loadingStates.isFetchingContestantList">
      <button
        v-for="button in genderFilterButtons"
        :key="button.value"
        :class="{ 'bg-amber-400': selectedGenderFilter === button.value }"
        @click="button.setSelectedGenderFilter(button.value)"
        class="cursor-pointer border border-black px-6 py-2"
      >
        {{ button.label }}
      </button>
    </div>

    <div class="flex w-full flex-col gap-8 overflow-y-auto md:h-[calc(85dvh-100px)]">
      <BaseFetchOverlay v-if="contestantStore.loadingStates.isFetchingContestantList" />
      <ServerErrorOverlayModal
        v-else-if="contestantStore.errorStates.isFetchingContestantListError"
        title="Failed to Load Contestants"
        description="We couldn't load the contestants. Please try again."
        :onRetry="retryFetchContestants"
      />
      <table v-else class="relative w-full">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="px-2 text-nowrap">Candidate Number</th>
            <th class="px-2 text-nowrap">Name</th>
            <th class="px-2 text-nowrap">Gender</th>
            <th class="px-2 text-nowrap">Team</th>
            <th class="px-2 text-nowrap">Action</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <tr
            class="font-poppins"
            v-for="contestant in contestantStore.contestantList"
            :key="contestant.id"
          >
            <td class="border px-2 font-bold text-nowrap">{{ contestant.candidateNumber }}</td>
            <td class="border px-2 text-nowrap">{{ contestant.name }}</td>
            <td class="border px-2 text-nowrap">{{ contestant.gender }}</td>
            <td class="border px-2 text-nowrap">{{ contestant.teamName }}</td>
            <td class="border px-2">
              <div class="flex h-12 items-center justify-center gap-4">
                <button
                  @click="emit('editContestant', contestant.id)"
                  class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 hover:bg-amber-400"
                >
                  Edit
                </button>
                <button
                  @click="handleDeleteContestant(contestant.id)"
                  class="h-10 cursor-pointer rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { useRoute, useRouter } from 'vue-router';
import {  ref, watch  } from 'vue';
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';

const route = useRoute();
const router = useRouter();
const contestantStore = useContestantStore();
const emit = defineEmits<{ editContestant: [id: number] }>();

const handleDeleteContestant = async (id: number) => {
  await contestantStore.deleteContestant(id);
};

const retryFetchContestants = async () => {
  const filterValue = (route.query.filter as Gender) || undefined;
  await contestantStore.getContestants(filterValue);
};

const selectedGenderFilter = ref<Gender | undefined>(undefined);
const setSelectedGenderFilter = (filter: Gender | undefined) => {
  selectedGenderFilter.value = filter;
  router.replace({ query: { filter: filter } });
};

interface FilterButtons {
  label: string;
  value: Gender | undefined;
  setSelectedGenderFilter: (value: Gender | undefined) => void;
}
const genderFilterButtons: FilterButtons[] = [
  {
    label: 'All',
    value: undefined,
    setSelectedGenderFilter: () => setSelectedGenderFilter(undefined),
  },
  {
    label: 'Male',
    value: 'MALE',
    setSelectedGenderFilter: (value?: Gender) => setSelectedGenderFilter(value),
  },
  {
    label: 'Female',
    value: 'FEMALE',
    setSelectedGenderFilter: (value?: Gender) => setSelectedGenderFilter(value),
  },
];

watch(()=>route.query.filter,async(newFilter) => {
    const filterValue = (newFilter as Gender) || undefined;
    if(filterValue && filterValue.toLowerCase() !== 'male' && filterValue.toLowerCase() !== 'female'){
      selectedGenderFilter.value = undefined;
      router.replace({ query: { filter: undefined } });
    } else {
      selectedGenderFilter.value = filterValue;
    }
  await contestantStore.getContestants(selectedGenderFilter.value);
}, { immediate: true });
</script>
