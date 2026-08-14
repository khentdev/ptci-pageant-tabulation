<script setup lang="ts">
import { CircleUser, Lock, CircleAlert, LoaderCircle } from '@lucide/vue';
import type { loginInput } from '@/types/auth/userAuth';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth/authStore';

const authStore = useAuthStore();
const userName = ref('');
const userPassword = ref('');

const clearError = () => {
  if (authStore.isInvalidCredentials) {
    authStore.isInvalidCredentials = '';
  }
};
const loginFunction = () => {
  if (userName.value === '' || userPassword.value === '') {
    return;
  }

  const userAuth: loginInput = {
    username: userName.value,
    password: userPassword.value,
  };

  authStore.loginUser(userAuth);
};
</script>

<template>
  <div
    class="font-poppins relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-4"
  >
    <div class="bg-bg1 absolute inset-0 -z-5 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    <div class="absolute flex h-full w-full gap-2 p-4 font-semibold">
      <p class="text-black/80">Ms & Mr.</p>
      <a class="text-main-dark-brown">PTCI</a>
      <img src="../../assets/imgs/PTCI.png" alt="" class="relative bottom-1 h-8 w-10" />
    </div>
    <form
      @submit.prevent=""
      class="from-auth-green to-main-light-brown flex h-full w-full flex-col items-center justify-center gap-4 rounded-3xl border border-black/15 bg-linear-150 from-30% to-100% py-6 drop-shadow-md drop-shadow-black/30 sm:w-md md:w-lg"
    >
      <div class="flex h-full w-full flex-col items-center justify-center gap-4">
        <img
          src="../../assets/imgs/ic2_logo.png"
          alt=""
          class="bg-custom-black/10 h-20 w-30 rounded-lg border border-black/10"
        />
        <p class="text-xl font-medium text-black/70">IC2 Pageant Tabulation</p>
      </div>

      <div class="flex h-full w-full flex-col items-center justify-center gap-2">
        <div class="relative h-full w-full px-6">
          <circle-user
            class="stroke stroke-custom-gray absolute top-1/2 left-10 -translate-y-1/2"
          ></circle-user>
          <input
            @input="clearError"
            required
            v-model="userName"
            type="text"
            placeholder="Username"
            class="focus:border-jungle-green-900 h-15 w-full rounded-xl border-2 border-black/10 bg-white/20 px-13 shadow-sm shadow-black/10 focus:outline-none dark:border-gray-500/20"
          />
        </div>

        <div class="relative h-full w-full px-6">
          <Lock class="stroke stroke-custom-gray absolute top-1/2 left-10 -translate-y-1/2"></Lock>
          <input
            @input="clearError"
            required
            v-model="userPassword"
            type="password"
            placeholder="Password"
            class="focus:border-jungle-green-900 h-15 w-full rounded-xl border-2 border-black/10 bg-white/20 px-13 shadow-sm shadow-black/10 focus:outline-none dark:border-gray-500/20"
          />
        </div>
        <div
          v-if="authStore.isInvalidCredentials"
          class="flex h-full w-full justify-center text-center"
        >
          <p class="flex px-6 text-sm text-red-500 sm:items-center sm:gap-2 sm:text-base">
            <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert
            >{{ authStore.isInvalidCredentials }}
          </p>
        </div>
      </div>

      <div class="flex h-full w-full flex-col items-center justify-center gap-2 px-6">
        <button
          type="submit"
          :disabled="authStore.isLoading"
          :class="authStore.buttonDisabled"
          @click="loginFunction"
          class="bg-jungle-green-900 flex h-15 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-white/10 text-white"
        >
          <LoaderCircle v-if="authStore.isLoading" class="animate-spin"></LoaderCircle>
          {{ authStore.isLoading ? '' : 'Sign in' }}
        </button>
      </div>
    </form>
  </div>
</template>
