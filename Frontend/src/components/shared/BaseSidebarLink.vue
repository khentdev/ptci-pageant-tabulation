<script setup lang="ts">
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

defineProps<{
  to: RouteLocationRaw;
  icon: Component;
  label: string;
}>();
</script>

<template>
  <RouterLink v-slot="{ href, navigate, isExactActive }" :to custom>
    <a
      :href
      :aria-current="isExactActive ? 'page' : undefined"
      class="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50"
      :class="
        isExactActive
          ? 'bg-main-dark-brown text-white font-semibold'
          : 'font-medium text-black/70 hover:bg-black/5 hover:text-black/90'
      "
      @click="navigate"
    >
      <component :is="icon" class="size-5 shrink-0" aria-hidden="true" />
      <span class="truncate">{{ label }}</span>
    </a>
  </RouterLink>
</template>
