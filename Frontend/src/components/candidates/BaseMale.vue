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
        <p class="font-lora text-xl font-bold italic sm:text-2xl">{{ can.canNumber }}</p>
        <div class="w-full text-sm xl:h-10">
          <p class="text-lg font-medium text-black/90">{{ can.canName }}</p>
        </div>

        <div class="flex w-full items-center justify-center gap-3 text-center text-xs">
          <p
            class="bg-main-dark-brown flex w-full items-center justify-center rounded-2xl border border-black/15 px-4 py-1 font-semibold text-white/90 drop-shadow-md drop-shadow-black/15 lg:h-8"
          >
            {{ can.canCourse }}
          </p>
          <p
            :class="`${can.canTeamColor === '#000000' ? 'bg-black text-white' : ''} ${can.canTeamColor === '#ffffff' ? 'bg-white text-black' : ''} ${can.canTeamColor === '#c27aff' ? 'bg-team-purple text-white' : ''} ${can.canTeamColor === '#05df72' ? 'bg-team-green text-black' : ''} ${can.canTeamColor === '#ff6467' ? 'bg-team-red text-white' : ''}`"
            class="flex w-full items-center justify-center rounded-2xl border border-black/15 px-4 py-1 font-semibold drop-shadow-md drop-shadow-black/15 lg:h-8"
          >
            {{ can.canTeamName }}
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
