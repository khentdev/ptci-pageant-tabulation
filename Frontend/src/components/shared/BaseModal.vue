<script setup lang="ts">
import { X } from '@lucide/vue';

withDefaults(
  defineProps<{
    showModal: boolean;
    title: string;
    showCloseButton?: boolean;
    cardClass?: string;
    titleClass?: string;
  }>(),
  {
    showCloseButton: true,
    cardClass: 'bg-amber-200',
    titleClass: 'text-2xl',
  },
);

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <teleport to="body">
    <div
      @click.self="emit('close')"
      v-if="showModal"
      class="font-poppins fixed inset-0 z-90 flex h-dvh items-center justify-center bg-black/50 p-4 py-10"
    >
      <div
        :class="cardClass"
        class="flex h-full max-h-full flex-col items-center overflow-hidden overflow-y-auto rounded-xl sm:w-lg md:h-auto"
      >
        <div class="flex w-full items-center justify-between p-4" :class="titleClass">
          <p>{{ title }}</p>
          <button
            v-if="showCloseButton"
            @click="emit('close')"
            class="flex cursor-pointer items-center justify-center rounded-full p-3 hover:bg-black/10"
          >
            <X />
          </button>
        </div>

        <slot></slot>
      </div>
    </div>
  </teleport>
</template>
