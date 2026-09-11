<script setup lang="ts">
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

withDefaults(
  defineProps<{
    icon: Component;
    title: string;
    description?: string;
    actionLabel?: string;
    to?: RouteLocationRaw;
    variant?: 'panel' | 'inline';
  }>(),
  {
    variant: 'panel',
  },
);

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <div
    v-if="variant === 'inline'"
    class="font-poppins flex w-full items-center justify-center gap-3 border border-black/40 py-6 text-center"
    role="status"
  >
    <component
      :is="icon"
      class="text-custom-gray size-5 shrink-0 stroke-[1.5]"
      aria-hidden="true"
    />
    <div class="flex flex-col items-start text-left">
      <p class="text-custom-black/70 text-sm font-medium">{{ title }}</p>
      <p v-if="description" class="text-custom-black/50 text-xs">{{ description }}</p>
    </div>
  </div>

  <div
    v-else
    class="font-poppins inset-0 flex h-full w-full items-center justify-center px-4 py-10"
    role="status"
    aria-labelledby="empty-state-title"
    aria-describedby="empty-state-description"
  >
    <div
      class="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-black/20 p-6 text-center shadow-lg"
    >
      <div class="bg-custom-gray/15 flex items-center justify-center rounded-full p-4">
        <component :is="icon" class="text-custom-gray size-10 stroke-[1.5]" aria-hidden="true" />
      </div>

      <div class="flex flex-col gap-2">
        <h2 id="empty-state-title" class="text-custom-black text-xl font-bold">{{ title }}</h2>
        <p v-if="description" id="empty-state-description" class="text-custom-black/60 text-sm">
          {{ description }}
        </p>
      </div>

      <router-link
        v-if="actionLabel && to"
        :to="to"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full rounded-xl p-4 text-sm font-semibold text-white transition-colors"
      >
        {{ actionLabel }}
      </router-link>
      <button
        v-else-if="actionLabel"
        type="button"
        @click="emit('action')"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 w-full cursor-pointer rounded-xl p-4 text-sm font-semibold text-white"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
