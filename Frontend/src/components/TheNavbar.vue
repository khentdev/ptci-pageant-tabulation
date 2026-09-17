<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Gavel, LayoutDashboard, LogIn, LogOut, Users } from '@lucide/vue';

import { useAuthStore } from '@/stores/auth/authStore';

const authStore = useAuthStore();
const route = useRoute();

const navBtnBase =
  'flex h-10 w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 sm:w-auto sm:px-4';

const navBtnActiveClass = `${navBtnBase} bg-main-dark-brown text-white hover:brightness-110`;
const navBtnInactiveClass = `${navBtnBase} border-main-dark-brown text-main-dark-brown border-2 hover:bg-main-dark-brown/10`;
const logoutBtnClass = `${navBtnBase} border-main-dark-brown text-main-dark-brown border-2 cursor-pointer hover:border-red-500 hover:bg-red-500 hover:text-white`;

const isPrivilegedUser = computed(
  () => authStore.isAdmin || authStore.isChairman || authStore.isJudge,
);

const brandRouteName = computed(() => {
  if (authStore.isJudge) {
    return 'judge-homepage';
  }
  if (authStore.isAdmin || authStore.isChairman) {
    return 'admin-homepage';
  }
  return 'candidates';
});

const displayName = computed(() => authStore.currentUser?.user.name ?? '');

const displayRoleLabel = computed(() => {
  if (authStore.isAdmin) {
    return 'Admin';
  }
  if (authStore.isChairman) {
    return 'Chairman';
  }
  if (authStore.isJudge) {
    return 'Judge';
  }
  return '';
});

const primaryActionLabel = computed(() => {
  if (authStore.isJudge) {
    return 'Judge';
  }
  if (authStore.isAdmin || authStore.isChairman) {
    return 'Rounds';
  }
  return '';
});

const primaryActionIcon = computed(() => (authStore.isJudge ? Gavel : LayoutDashboard));

const primaryActionRouteName = computed(() => {
  if (authStore.isJudge) {
    return 'judge-homepage';
  }
  if (authStore.isAdmin) {
    return 'rounds';
  }
  if (authStore.isChairman) {
    return 'admin-homepage';
  }
  return null;
});

const isCandidatesActive = computed(() => route.name === 'candidates');

const isLoginActive = computed(() => route.name === 'login');

const isRoundsActive = computed(
  () => (authStore.isAdmin || authStore.isChairman) && route.path.startsWith('/admin/live/results'),
);

const isJudgeActive = computed(() => authStore.isJudge && route.path.startsWith('/judge/scoring'));

const loginBtnClass = computed(() =>
  isLoginActive.value ? navBtnActiveClass : navBtnInactiveClass,
);

const candidatesBtnClass = computed(() =>
  isCandidatesActive.value ? navBtnActiveClass : navBtnInactiveClass,
);

const primaryActionBtnClass = computed(() => {
  if (authStore.isJudge) {
    return isJudgeActive.value ? navBtnActiveClass : navBtnInactiveClass;
  }
  if (authStore.isAdmin || authStore.isChairman) {
    return isRoundsActive.value ? navBtnActiveClass : navBtnInactiveClass;
  }
  return navBtnInactiveClass;
});
</script>

<template>
  <div
    class="bg-main-light-brown font-poppins sticky top-0 z-20 flex h-15 w-full items-center justify-between border-b-2 border-black/15 px-6 drop-shadow-sm drop-shadow-black/10 sm:h-20 sm:py-4 md:px-8"
  >
    <RouterLink
      :to="{ name: brandRouteName }"
      class="flex items-center gap-1 text-base font-bold text-nowrap sm:text-2xl"
    >
      <span class="text-black/70 sm:inline">Ms & Mr.</span>
      <span class="text-main-dark-brown">PTCI</span>
    </RouterLink>

    <div class="flex w-full items-center justify-end gap-2 text-sm sm:gap-4 sm:text-base">
      <p v-if="isPrivilegedUser" class="hidden font-medium text-black/80 lg:block">
        <span>{{ displayName }}</span>
        <span class="text-black/55"> ({{ displayRoleLabel }})</span>
      </p>

      <RouterLink
        v-if="!isPrivilegedUser"
        :to="{ name: 'login' }"
        :class="loginBtnClass"
        aria-label="Login"
      >
        <LogIn class="size-4 shrink-0" />
        <span class="hidden sm:inline">Login</span>
      </RouterLink>

      <RouterLink :to="{ name: 'candidates' }" :class="candidatesBtnClass" aria-label="Candidates">
        <Users class="size-4 shrink-0" />
        <span class="hidden sm:inline">Candidates</span>
      </RouterLink>

      <RouterLink
        v-if="isPrivilegedUser && primaryActionRouteName"
        :to="{ name: primaryActionRouteName }"
        :class="primaryActionBtnClass"
        :aria-label="primaryActionLabel"
      >
        <component :is="primaryActionIcon" class="size-4 shrink-0" />
        <span class="hidden sm:inline">{{ primaryActionLabel }}</span>
      </RouterLink>

      <button
        v-if="isPrivilegedUser"
        type="button"
        @click="authStore.logoutUser"
        :class="logoutBtnClass"
        aria-label="Logout"
      >
        <LogOut class="size-4 shrink-0" />
        <span class="hidden sm:inline">Logout</span>
      </button>
    </div>
  </div>
</template>
