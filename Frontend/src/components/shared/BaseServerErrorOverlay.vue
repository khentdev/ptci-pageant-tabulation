<template>
  <div class="font-poppins flex h-full w-full items-center justify-center px-4" role="alert">
    <div
      class="bg-main-light-brown flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border border-black/10 px-6 py-5 text-center text-sm shadow-sm"
    >
      <h2 class="flex items-center gap-1.5 font-semibold text-black/70">
        <AlertCircle class="size-4 shrink-0 text-red-600" aria-hidden="true" />
        {{ title }}
      </h2>
      <p class="text-black/60">{{ description }}</p>
      <button
        type="button"
        @click="onRetry()"
        class="mt-2 flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/30 px-3 py-1.5 text-black/70 transition-colors hover:bg-black/5"
      >
        <RotateCcw class="size-4 shrink-0" aria-hidden="true" />
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, RotateCcw } from '@lucide/vue';

defineProps<{
  title: string;
  description: string;
  onRetry: () => void;
}>();
</script>
