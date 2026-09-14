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
    class="h-full w-full rounded-lg border border-black/15"
    v-for="can in candidateStore.maleCandidatesItems"
    :key="can.canNumber"
  >
    <div class="flex h-3/5 items-center justify-center border-b border-black/15 bg-black/5">
      <img
        v-if="can.canPicture && can.canPicture !== '' && !failedImages[can.canNumber]"
        :src="`${can.canPicture}`"
        alt=""
        class="h-full w-full rounded-t-lg object-cover"
        @error="handleErrorImages(can.canNumber)"
      />
      <ImageOff v-else class="stroke stroke-custom-gray size-10"></ImageOff>
    </div>

    <div class="flex h-3/7 w-full items-center px-2">
      <div class="flex flex-col gap-2">
        <p class="text-2xl font-semibold italic">{{ can.canNumber }}</p>
        <p class="text-xl font-medium">{{ can.canName }}</p>
        <p class="flex items-center gap-2 text-lg">
          <img :src="`${can.canTeamLogo}`" class="size-10" />
          {{ can.canTeamName }}
        </p>
      </div>
    </div>
  </div>
</template>
