<script setup lang="ts">
import { Plus } from '@lucide/vue';
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
import ServerErrorOverlay from '@/components/shared/ServerErrorOverlay.vue';

defineProps<{
  title: string;
  addButtonLabel: string;
  isLoading: boolean;
  isError: boolean;
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
  <ServerErrorOverlay
    v-else-if="isError"
    :title="errorTitle"
    :description="errorDescription"
    :onRetry="onRetry"
  />
  <div
    v-else
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">{{ title }}</p>

      <button
        @click="emit('add')"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"/> {{ addButtonLabel }}
      </button>
    </div>

    <slot name="toolbar"></slot>

    <div class="relative w-full overflow-y-auto md:h-[calc(100dvh-100px)]">
      <slot></slot>
    </div>
  </div>
</template>
