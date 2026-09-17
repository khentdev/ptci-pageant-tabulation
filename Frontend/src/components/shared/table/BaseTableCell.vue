<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Prevent the cell's text content from wrapping. Defaults to true. */
    nowrap?: boolean;
    /** Drop the cell's own padding, letting inner content (e.g. inputs) fill it. */
    flush?: boolean;
  }>(),
  {
    nowrap: true,
    flush: false,
  },
);
</script>

<template>
  <td class="border border-black/40" :class="[flush ? '' : 'p-2', nowrap ? 'text-nowrap' : '']">
    <slot />
  </td>
</template>
