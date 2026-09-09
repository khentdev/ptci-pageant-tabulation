<script setup lang="ts">
import { useAuthStore } from '@/stores/auth/authStore';

const authStore = useAuthStore();
</script>

<template>
  <div
    class="bg-main-light-brown font-poppins flex h-15 w-full justify-between border-b-2 border-black/15 p-2 drop-shadow-sm drop-shadow-black/10 sm:h-20 sm:px-15 sm:py-4 xl:px-25"
  >
    <a
      v-if="authStore.isAdmin"
      href="/admin/live/results"
      class="flex items-center text-sm font-bold sm:text-2xl"
    >
      <p class="text-black/70">Ms & Mr.</p>
      <span class="text-main-dark-brown">PTCI</span>
      <img src="../assets/imgs/PTCI.png" alt="" class="ml-2 h-8 w-10" />
    </a>
    <a
      v-if="authStore.isJudge"
      href="/judge/scoring"
      class="flex items-center text-sm font-bold sm:text-2xl"
    >
      <p class="text-black/70">Ms & Mr.</p>
      <span class="text-main-dark-brown">PTCI</span>
      <img src="../assets/imgs/PTCI.png" alt="" class="ml-2 h-8 w-10" />
    </a>
    <div class="flex items-center gap-2 text-sm sm:gap-4 sm:text-base">
      <p v-if="authStore.isAdmin" class="font-medium text-black/50">PTCI Admin</p>
      <p v-else-if="authStore.isJudge" class="font-medium text-black/50">
        Welcome,
        {{ authStore.currentUser?.user.name }}
      </p>
      <button
        @click="authStore.logoutUser"
        v-if="authStore.isAdmin || authStore.isJudge"
        class="border-main-dark-brown text-main-dark-brown rounded-3xl border-2 px-3 py-1 font-semibold sm:px-4"
      >
        Logout
      </button>
    </div>
  </div>
</template>
