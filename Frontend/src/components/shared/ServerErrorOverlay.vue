<template>
    <div
      class="font-poppins  inset-0 flex items-center justify-center  px-4"
      role="alertdialog"
      aria-labelledby="server-error-title"
      aria-describedby="server-error-description"
      aria-modal="true"
    >
      <div class="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl bg-white/95 p-6 text-center shadow-lg">
        <div class="flex items-center justify-center rounded-full bg-red-100/60 p-4">
          <AlertCircle class="size-10 stroke-[1.5] text-red-500" aria-hidden="true" />
        </div>

        <div class="flex flex-col gap-2">
          <h2 id="server-error-title" class="text-xl font-bold text-custom-black">
            {{ title }}
          </h2>
          <p id="server-error-description" class="text-sm text-custom-black/60">
            {{ description }}
          </p>
        </div>

        <button
          type="button"
          @click="onRetry"
          class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full cursor-pointer rounded-xl p-4 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    </div>
</template>

<script setup lang="ts">
import { AlertCircle } from '@lucide/vue';

defineProps<{
  title: string;
  description: string;
  onRetry: () => void;
}>();
</script>
