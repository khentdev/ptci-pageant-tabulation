<template>
  <div
    class="font-poppins flex h-full w-full items-center justify-center gap-2 p-5 text-sm text-black/60"
    role="status"
    aria-live="polite"
  >
    <BaseSpinner />
    <span>Loading…</span>
  </div>
</template>

<script setup lang="ts">
import BaseSpinner from '@/components/shared/BaseSpinner.vue';
</script>
