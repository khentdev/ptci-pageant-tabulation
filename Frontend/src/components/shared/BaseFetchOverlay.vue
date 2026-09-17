<template>
  <div
    class="font-poppins flex h-full w-full items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div
      class="bg-main-light-brown flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-black/60 shadow-sm"
    >
      <BaseSpinner />
      <span>Loading…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseSpinner from '@/components/shared/BaseSpinner.vue';
</script>
