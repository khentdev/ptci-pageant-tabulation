<script setup lang="ts">
import { useCandidateStore } from '@/stores/candidates/candidateStore';
import { ref } from 'vue';
import { ImageOff } from '@lucide/vue';

const candidateStore = useCandidateStore();
const failedImages = ref<Record<string, boolean>>({});

const handleErrorImages = (canNumber: string) => {
  failedImages.value[canNumber] = true;
};
</script>

<template>
  <div
    class="w-full rounded-2xl border border-black/15"
    v-for="can in candidateStore.malesCandidatesItems"
    :key="can.canNumber"
  >
    <div
      class="group flex w-full items-center justify-center overflow-hidden rounded-t-2xl border-b border-black/15 bg-black/10 transition-all"
    >
      <img
        v-if="can.canPicture && can.canPicture !== '' && !failedImages[can.canNumber]"
        :src="`${can.canPicture}`"
        alt=""
        class="h-full w-full object-cover duration-300 ease-in-out group-hover:scale-110"
        @error="handleErrorImages(can.canNumber)"
      />
      <ImageOff v-else class="stroke stroke-custom-gray size-10 rounded-t-2xl"></ImageOff>
    </div>

    <div class="my-8 flex w-full items-center px-4">
      <div class="flex w-full flex-col justify-center gap-4">
        <p class="font-serif text-xl font-bold italic sm:text-2xl">{{ can.canNumber }}</p>
        <div class="w-full text-sm xl:h-12">
          <p class="text-lg font-medium text-black/90">{{ can.canName }}</p>
        </div>

        <div class="flex w-full items-center justify-center gap-2 text-center text-xs">
          <p
            class="bg-main-dark-brown flex w-full items-center justify-center rounded-2xl border border-black/15 px-4 py-1 text-white/90 lg:h-10"
          >
            {{ can.canTeamName }}
          </p>

          <p
            class="bg-main-dark-brown flex w-full items-center justify-center rounded-2xl border border-black/15 px-4 py-1 text-white/90 lg:h-10"
          >
            {{ can.canCourse }}
          </p>
        </div>

        <div class="flex h-10 w-full items-center px-2">
          <img
            v-if="can.canTeamLogo && can.canTeamLogo !== '' && !failedImages[can.canNumber]"
            :src="`${can.canTeamLogo}`"
            class="size-12"
            @error="handleErrorImages(can.canNumber)"
          />
          <ImageOff v-else class="stroke stroke-custom-gray size-7"></ImageOff>
        </div>
      </div>
    </div>
  </div>
</template>
