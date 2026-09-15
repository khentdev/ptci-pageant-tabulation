<script setup lang="ts">
import BaseFemales from '@/components/candidates/BaseFemales.vue';
import BaseMale from '@/components/candidates/BaseMale.vue';
import NavMain from '@/components/navMain.vue';
import { useCandidateStore } from '@/stores/candidates/candidateStore';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { ref } from 'vue';

const selectedGenderFilter = ref<Gender | undefined>(undefined);
const candidateStore = useCandidateStore();
</script>

<template>
  <NavMain></NavMain>
  <div class="font-poppins relative flex min-h-screen w-full flex-col items-start overflow-hidden">
    <div class="flex w-full flex-col">
      <div class="bg-bg1 absolute inset-0 -z-5 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    </div>
    <div class="flex min-h-screen w-full flex-col gap-6 p-8 drop-shadow-sm drop-shadow-black/10">
      <div class="flex w-full gap-4 px-6">
        <button
          v-for="button in candidateStore.genderFilterButtons"
          :key="button.label"
          :class="{ 'bg-main-dark-brown text-white': selectedGenderFilter === button.value }"
          class="cursor-pointer rounded-md border border-black/40 px-6 py-2"
        >
          {{ button.label }}
        </button>
      </div>

      <div
        class="bg-main-light-brown grid h-[calc(100vh-1rem)] w-full grid-cols-5 gap-9 overflow-y-auto rounded-lg border border-black/15 p-8"
      >
        <BaseMale></BaseMale>
        <BaseFemales></BaseFemales>
      </div>
    </div>
  </div>
</template>
