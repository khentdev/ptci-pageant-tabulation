<script setup lang="ts">
import CandidateFemaleList from '@/components/candidates/CandidateFemaleList.vue';
import CandidateMaleList from '@/components/candidates/CandidateMaleList.vue';
import TheNavbar from '@/components/TheNavbar.vue';
import router from '@/router';
import { useCandidateStore } from '@/stores/candidates/candidateStore';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const candidateStore = useCandidateStore();
const selectedGenderFilter = ref<Gender | undefined>(undefined);

const setSelectedGender = (filter: Gender | undefined) => {
  router.replace({ query: { filter } });
};

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
      await router.replace({ query: { filter: undefined } });
    } else {
      selectedGenderFilter.value = filterValue;
    }
  },
  { immediate: true },
);
</script>

<template>
  <TheNavbar></TheNavbar>
  <div class="font-poppins relative flex min-h-screen w-full flex-col items-start">
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="bg-bg1 absolute inset-0 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    </div>
    <div class="relative flex min-h-screen w-full flex-col p-2 md:p-8">
      <section
        class="bg-main-light-brown w-full overflow-clip rounded-lg border border-black/15 drop-shadow-sm drop-shadow-black/10"
      >
        <div
          class="bg-main-light-brown sticky top-15 z-10 border-b border-black/10 p-2 sm:top-20 2xl:px-8 2xl:py-4"
        >
          <div role="group" aria-label="Filter candidates by gender" class="flex w-full gap-2">
            <button
              v-for="gender in candidateStore.genderFilterButtons"
              :key="gender.label"
              type="button"
              :aria-pressed="selectedGenderFilter === gender.value"
              :class="{ 'bg-main-dark-brown text-white': selectedGenderFilter === gender.value }"
              class="flex-1 cursor-pointer rounded-md border border-black/40 px-6 py-2 md:flex-none"
              @click="setSelectedGender(gender.value)"
            >
              {{ gender.label }}
            </button>
          </div>
        </div>

        <div
          class="grid w-full grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-9 2xl:p-8"
        >
          <CandidateMaleList v-if="route.query.filter === 'MALE'"></CandidateMaleList>
          <CandidateFemaleList v-else-if="route.query.filter === 'FEMALE'"></CandidateFemaleList>
          <template v-else>
            <CandidateMaleList></CandidateMaleList>
            <CandidateFemaleList></CandidateFemaleList>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
