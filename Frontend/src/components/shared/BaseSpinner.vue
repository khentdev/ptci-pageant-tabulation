<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'sm',
  },
);
</script>

<template>
  <span
    class="border-jungle-green-900/20 border-t-jungle-green-900 inline-block shrink-0 animate-spin rounded-full border-2 motion-reduce:animate-none"
    :class="size === 'md' ? 'size-6' : 'size-4'"
    aria-hidden="true"
  />
</template>
