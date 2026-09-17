<script setup lang="ts">
// Generic table shell shared by every data table in the app.
// Supplies the sticky, neutral-colored head row and the tbody wrapper;
// callers provide `<BaseTableHeader>` cells via the #head slot and their
// own `<tr>` rows (built from `<BaseTableCell>`) via the default slot.
</script>

<template>
  <table class="relative w-full border-collapse">
    <thead class="sticky top-0 z-20">
      <tr
        class="bg-dark-khaki-200 text-dark-khaki-900 border-dark-khaki-400 h-10 border-b text-left text-sm font-semibold sm:h-20 sm:text-xl"
      >
        <slot name="head" />
      </tr>
    </thead>
    <tbody>
      <slot />
    </tbody>
  </table>
</template>
