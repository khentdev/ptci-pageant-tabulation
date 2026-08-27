<template>
  <div class="flex h-full w-full flex-col gap-4">
    <div class="flex gap-4">
      <button
        :class="{ 'bg-amber-400': !route.query.filter }"
        @click="applyFilter()"
        class="cursor-pointer border border-black px-6 py-2"
      >
        All
      </button>
      <button
        :class="{ 'bg-amber-400': route.query.filter === 'MALE' }"
        @click="applyFilter('MALE')"
        class="cursor-pointer border border-black px-6 py-2"
      >
        Male
      </button>
      <button
        :class="{ 'bg-amber-400': route.query.filter === 'FEMALE' }"
        @click="applyFilter('FEMALE')"
        class="cursor-pointer border border-black px-6 py-2"
      >
        Female
      </button>
    </div>

    <div class="flex w-full flex-col gap-8 overflow-y-auto md:h-[calc(85dvh-100px)]">
      <table class="relative w-full">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="text-center">Id</th>
            <th class="text-center">Name</th>
            <th class="text-center">Gender</th>
            <th class="text-center">Team</th>
            <th class="text-center">Action</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <tr
            class="font-poppins"
            v-for="contestant in contestantStore.contestantList"
            :key="contestant.candidateNumber"
          >
            <td class="border text-center">{{ contestant.candidateNumber }}</td>
            <td class="border text-center">{{ contestant.name }}</td>
            <td class="border text-center">{{ contestant.gender }}</td>
            <td class="border text-center">{{ contestant.teamName }}</td>
            <td class="border">
              <div class="flex h-12 items-center justify-center gap-4">
                <button class="h-10 rounded-xl bg-amber-300 px-6 hover:bg-amber-400">Edit</button>
                <button
                  @click="handleDeleteContestant(contestant.candidateNumber)"
                  class="h-10 rounded-xl bg-amber-600 px-6 hover:bg-amber-700"
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
import { watch } from 'vue';

const router = useRouter();
const route = useRoute();
const contestantStore = useContestantStore();

const handleDeleteContestant = async (id: number) => {
  contestantStore.deleteContestant(id);
};

const applyFilter = (gender?: Gender) => {
  router.push({
    query: {
      ...route.query,
      filter: gender || undefined,
    },
  });
};

watch(
  () => route.query.filter,
  (newFilter) => {
    const filterValue = (newFilter as Gender) || undefined;
    contestantStore.getContestants(filterValue);
  },
  { immediate: true },
);
</script>
