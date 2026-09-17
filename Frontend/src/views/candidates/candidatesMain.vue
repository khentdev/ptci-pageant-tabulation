<script setup lang="ts">
import BaseFemales from '@/components/candidates/BaseFemales.vue';
import BaseMale from '@/components/candidates/BaseMale.vue';
import NavMain from '@/components/navMain.vue';
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
  <NavMain></NavMain>
  <div class="font-poppins relative flex min-h-screen w-full flex-col items-start">
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="bg-bg1 absolute inset-0 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    </div>
    <div class="relative flex min-h-screen w-full flex-col gap-6 p-2 md:p-8">
      <header class="sticky top-20 z-10 -mx-2 flex px-2 md:-mx-8 md:px-8">
        <div
          class="bg-main-light-brown flex w-full gap-2 rounded-lg border border-black/15 px-2 py-2 drop-shadow-sm drop-shadow-black/10"
        >
          <button
            v-for="gender in candidateStore.genderFilterButtons"
            :key="gender.label"
            :class="{ 'bg-main-dark-brown text-white': selectedGenderFilter === gender.value }"
            @click="setSelectedGender(gender.value)"
            class="cursor-pointer rounded-md border border-black/40 px-6 py-2"
          >
            {{ gender.label }}
          </button>
        </div>
      </header>

      <div
        class="bg-main-light-brown grid w-full grid-cols-1 gap-2 rounded-lg border border-black/15 p-2 drop-shadow-sm drop-shadow-black/10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-9 2xl:p-8"
      >
        <BaseMale v-if="route.query.filter === 'MALE'"></BaseMale>
        <BaseFemales v-else-if="route.query.filter === 'FEMALE'"></BaseFemales>
        <template v-else>
          <BaseMale></BaseMale>
          <BaseFemales></BaseFemales>
        </template>
      </div>
    </div>
  </div>
</template>
