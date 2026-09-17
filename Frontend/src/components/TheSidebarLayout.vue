<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { onKeyStroke, useMediaQuery } from '@vueuse/core';
import { SquareArrowLeft, SquareArrowRight } from '@lucide/vue';
import TheNavbar from '@/components/TheNavbar.vue';

defineProps<{
  title: string;
}>();

const route = useRoute();

const isDesktop = useMediaQuery('(min-width: 48rem)');

const isOpen = ref(isDesktop.value);

watch(isDesktop, (desktop) => {
  isOpen.value = desktop;
});

const closeDrawer = () => {
  if (!isDesktop.value) {
    isOpen.value = false;
  }
};

watch(() => route.fullPath, closeDrawer);
onKeyStroke('Escape', closeDrawer);
</script>

<template>
  <TheNavbar />

  <div class="font-poppins relative flex min-h-screen w-full overflow-x-clip">
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="bg-bg1 absolute inset-0 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    </div>

    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="!isOpen"
        type="button"
        aria-label="Open sidebar"
        class="absolute top-4 left-0 opacity-80 z-10 cursor-pointer"
        @click="isOpen = true"
      >
        <SquareArrowRight class="stroke bg-main-dark-brown h-10 w-10 rounded-md stroke-white p-2" />
      </button>
    </Transition>

    <div
      class="fixed inset-x-0 top-15 bottom-0 z-30 bg-black/40 transition-opacity duration-300 ease-in-out motion-reduce:transition-none sm:top-20 md:hidden"
      :class="isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
      aria-hidden="true"
      @click="isOpen = false"
    ></div>

    <aside
      :inert="!isOpen"
      class="fixed top-15 bottom-0 left-0 z-40 transition-[translate,width,opacity] duration-300 ease-in-out motion-reduce:transition-none sm:top-20 md:sticky md:top-20 md:bottom-auto md:z-auto md:h-[calc(100dvh-5rem)] md:shrink-0 md:translate-x-0 md:self-start md:overflow-hidden"
      :class="isOpen ? 'translate-x-0 md:w-72 xl:w-80' : '-translate-x-full md:w-0 md:opacity-0'"
    >
      <div class="h-full w-full p-2 sm:p-4 md:w-72 xl:w-80">
        <div
          class="bg-main-light-brown flex h-full w-full flex-col gap-2 overflow-y-auto overscroll-contain rounded-xl border border-black/20 drop-shadow-sm drop-shadow-black/10"
        >
          <div class="flex shrink-0 items-center justify-between px-6 py-2">
            <p class="flex h-14 w-full items-center text-xl font-bold text-black/70 sm:text-2xl">
              {{ title }}
            </p>
            <button
              type="button"
              aria-label="Close sidebar"
              class="shrink-0 cursor-pointer"
              @click="isOpen = false"
            >
              <SquareArrowLeft
                class="stroke bg-main-dark-brown h-10 w-10 rounded-md stroke-white p-2"
              />
            </button>
          </div>

          <slot name="nav" />
        </div>
      </div>
    </aside>

    <main class="min-w-0 flex-1 p-4">
      <div class="flex h-[calc(100vh-2.2rem)] w-full items-center justify-center">
        <slot />
      </div>
    </main>
  </div>
</template>
