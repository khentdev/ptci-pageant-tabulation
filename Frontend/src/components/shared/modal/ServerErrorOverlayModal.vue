<template>
  <div
    class="font-poppins flex h-full w-full items-center justify-center rounded-xl px-4"
    role="alertdialog"
    aria-labelledby="server-error-title"
    aria-describedby="server-error-description"
    aria-modal="true"
  >
    <div class="flex w-full flex-col items-center gap-4 p-4 text-center">
      <div class="flex flex-col gap-1">
        <h2 id="server-error-title" class="text-base font-semibold text-custom-black">
          {{ title }}
        </h2>
        <p id="server-error-description" class="text-xs leading-relaxed text-custom-black/60">
          {{ description }}
        </p>
      </div>
      <button
        type="button"
        @click="onRetry"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 cursor-pointer rounded-lg px-5 py-2 text-xs font-semibold text-white"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  onRetry: () => Promise<void>;
}>();
</script>
