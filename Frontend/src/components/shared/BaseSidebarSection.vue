<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <section class="flex flex-col gap-1">
    <h2 class="px-3 pb-1 text-xs font-semibold tracking-wider text-black/60 uppercase">
      {{ label }}
    </h2>
    <slot />
  </section>
</template>
