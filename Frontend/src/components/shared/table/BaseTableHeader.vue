<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Text alignment for the header cell. Defaults to left. */
    align?: 'left' | 'center';
    /** Allow the header label to wrap instead of forcing a single line. */
    wrap?: boolean;
  }>(),
  {
    align: 'left',
    wrap: false,
  },
);
</script>

<template>
  <th class="px-3" :class="[wrap ? '' : 'text-nowrap', align === 'center' && 'text-center']">
    <slot />
  </th>
</template>
