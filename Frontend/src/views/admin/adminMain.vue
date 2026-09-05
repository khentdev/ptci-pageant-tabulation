<script setup lang="ts">
import NavMain from '@/components/navMain.vue';
import { ref, type Component } from 'vue';
import { Calendar, LayoutGrid, SquareArrowLeft, SquareArrowRight, Users } from '@lucide/vue';
import { RouterView } from 'vue-router';
import LiveRoundSideBar from '@/components/admin/live_event/liveRoundSideBar.vue';

type SetupNavItem = {
  label: string;
  routeName: string;
  icon: Component;
};

const setupNavItems: SetupNavItem[] = [
  { label: 'Rounds', routeName: 'rounds', icon: Calendar },
  { label: 'Categories', routeName: 'categories', icon: LayoutGrid },
  { label: 'Contestants', routeName: 'contestants', icon: Users },
  { label: 'Judges', routeName: 'judge', icon: Users },
];

const getDropDownState = (): boolean | null => {
  const savedState = localStorage.getItem('toggleDropDown');
  return savedState ? JSON.parse(savedState) : false;
};

const isDropDownClick = ref(getDropDownState());
const toggleDropDown = () => {
  isDropDownClick.value = !isDropDownClick.value;

  localStorage.setItem('toggleDropDown', JSON.stringify(isDropDownClick.value));
};
</script>

<template>
  <nav-main />
  <div class="font-poppins relative flex min-h-screen w-full flex-col items-start overflow-hidden">
    <div class="flex w-full flex-col">
      <div class="bg-bg1 absolute inset-0 -z-5 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    </div>
    <div class="flex h-full w-full">
      <div @click="toggleDropDown" v-if="isDropDownClick === false" class="py-4">
        <SquareArrowRight
          class="stroke bg-main-dark-brown absolute z-99 h-10 w-10 rounded-md stroke-white p-2 sm:relative"
        ></SquareArrowRight>
      </div>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="-translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition-all duration-250 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="-translate-x-full opacity-0"
      >
        <div
          v-if="isDropDownClick === true"
          class="flex h-[calc(100vh-0.2rem)] w-full p-2 sm:w-3/8 sm:p-4 lg:w-3/12"
        >
          <div
            class="bg-main-light-brown flex h-full w-full flex-col gap-2 rounded-xl border border-black/20 drop-shadow-sm drop-shadow-black/10"
          >
            <div class="flex shrink-0 items-center justify-between px-6 py-2">
              <p class="w-fulll text-xl font-bold text-black/70 sm:text-2xl">ADMIN</p>
              <SquareArrowLeft
                @click="toggleDropDown"
                class="stroke bg-main-dark-brown h-10 w-10 rounded-md stroke-white p-2"
              ></SquareArrowLeft>
            </div>

            <div class="flex shrink-0 flex-col">
              <div class="flex h-full w-full px-4">
                <p class="h-px flex-1 bg-black/30"></p>
              </div>
              <p class="px-6 py-1 text-base font-medium text-black/70 sm:text-lg">SETUP</p>
            </div>

            <div class="flex shrink-0 flex-col gap-2 px-4 transition-all">
              <RouterLink
                v-for="item in setupNavItems"
                :key="item.routeName"
                exact-active-class="bg-main-dark-brown text-white hover:bg-main-dark-brown"
                :to="{ name: item.routeName }"
                class="flex items-center gap-4 rounded-lg border border-black/30 px-4 py-2 hover:bg-black/5 sm:p-4"
              >
                <component :is="item.icon"></component>
                <p class="cursor-pointer">{{ item.label }}</p>
              </RouterLink>
            </div>

            <div class="mt-2 flex shrink-0 flex-col">
              <div class="flex h-full w-full px-4">
                <p class="h-px flex-1 bg-black/30"></p>
              </div>
              <p class="px-6 py-1 text-base font-medium text-black/70 sm:text-lg">LIVE EVENT</p>
            </div>

            <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
              <LiveRoundSideBar></LiveRoundSideBar>
            </div>
          </div>
        </div>
      </Transition>

      <div
        :class="isDropDownClick === true ? 'hidden sm:block' : 'block'"
        class="h-full w-full p-4"
      >
        <div class="flex h-[calc(100vh-2.2rem)] w-full items-center justify-center">
          <RouterView></RouterView>
        </div>
      </div>
    </div>
  </div>
</template>
