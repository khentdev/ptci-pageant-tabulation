<script setup lang="ts">
import { Plus } from '@lucide/vue';
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
import BaseServerErrorOverlay from '@/components/shared/BaseServerErrorOverlay.vue';

defineProps<{
  title: string;
  addButtonLabel?: string;
  isLoading: boolean;
  isError: boolean;
  isNotFound?: boolean;
  errorTitle: string;
  errorDescription: string;
  onRetry: () => void | Promise<void>;
}>();

const emit = defineEmits<{
  add: [];
}>();
</script>

<template>
  <BaseFetchOverlay v-if="isLoading" />
  <BaseServerErrorOverlay
    v-else-if="isError"
    :title="errorTitle"
    :description="errorDescription"
    :onRetry="onRetry"
  />
  <slot v-else-if="isNotFound" name="not-found"></slot>
  <div
    v-else
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-3 md:px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="mb-2 flex w-full items-center justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">{{ title }}</p>

      <button
        v-if="addButtonLabel"
        @click="emit('add')"
        class="bg-main-dark-brown hover:bg-main-dark-brown/80 flex h-10 items-center gap-2 rounded-lg border border-white/30 p-4 text-xs text-nowrap text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8" />
        <span class="hidden text-nowrap sm:block">{{ addButtonLabel }}</span>
      </button>
    </div>

    <slot name="toolbar"></slot>

    <div class="relative w-full overflow-y-auto md:h-[calc(100dvh-100px)]">
      <slot></slot>
    </div>
  </div>
</template>
