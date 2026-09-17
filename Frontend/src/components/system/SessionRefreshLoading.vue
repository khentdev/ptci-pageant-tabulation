<template>
  <Teleport to="body">
    <div
      class="font-poppins from-auth-green to-main-light-brown fixed inset-0 z-50 flex items-center justify-center bg-linear-150 from-30% to-100%"
      role="status"
      aria-live="polite"
    >
      <BaseSpinner size="md" />
      <span class="sr-only">Refreshing session…</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import BaseSpinner from '@/components/shared/BaseSpinner.vue';
</script>
