<script setup lang="ts">
import { CircleAlert, CircleUser, LoaderCircle, Lock } from '@lucide/vue';
import type { loginInput } from '@/types/auth/userAuth';
import { ref } from 'vue';
import TheNavbar from '@/components/TheNavbar.vue';
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

const inputClass =
  'h-12 w-full rounded-lg border border-black/20 bg-white/60 pr-3 pl-10 text-black/80 transition-colors placeholder:text-black/40 focus:border-main-dark-brown focus:ring-2 focus:ring-main-dark-brown/30 focus:outline-none';
</script>

<template>
  <TheNavbar />

  <div
    class="font-poppins relative flex min-h-[calc(100dvh-3.75rem)] w-full items-center justify-center px-4 py-10 sm:min-h-[calc(100dvh-5rem)]"
  >
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="bg-bg1 absolute inset-0 scale-105 bg-cover bg-no-repeat blur-sm"></div>
    </div>

    <form
      class="bg-main-light-brown flex w-full max-w-md flex-col gap-6 rounded-xl border border-black/20 px-6 py-8 drop-shadow-sm drop-shadow-black/10 sm:px-8"
      @submit.prevent="loginFunction"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <img
          src="../../assets/imgs/PTCI.png"
          alt="Palawan Technological College, Inc. logo"
          class="h-20 w-auto object-contain"
        />
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold text-black/80">PTCI Pageant Tabulation</h1>
          <p class="text-sm text-black/60">Sign in to continue.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="login-username" class="text-sm font-medium text-black/70">Username</label>
          <div class="relative">
            <CircleUser
              class="text-custom-gray pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="login-username"
              v-model="userName"
              name="username"
              type="text"
              autocomplete="username"
              placeholder="Enter your username"
              required
              :aria-invalid="Boolean(authStore.isInvalidCredentials)"
              aria-describedby="login-error"
              :class="inputClass"
              @input="clearError"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="login-password" class="text-sm font-medium text-black/70">Password</label>
          <div class="relative">
            <Lock
              class="text-custom-gray pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="login-password"
              v-model="userPassword"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
              :aria-invalid="Boolean(authStore.isInvalidCredentials)"
              aria-describedby="login-error"
              :class="inputClass"
              @input="clearError"
            />
          </div>
        </div>

        <p
          v-if="authStore.isInvalidCredentials"
          id="login-error"
          role="alert"
          class="flex items-center gap-1.5 text-sm text-red-700"
        >
          <CircleAlert class="size-4 shrink-0" aria-hidden="true" />
          {{ authStore.isInvalidCredentials }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="authStore.loadingStates.isLoggingIn"
        class="bg-main-dark-brown enabled:hover:bg-main-dark-brown/80 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LoaderCircle
          v-if="authStore.loadingStates.isLoggingIn"
          class="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        {{ authStore.loadingStates.isLoggingIn ? 'Signing in…' : 'Sign in' }}
      </button>

      <div class="flex items-center justify-center gap-3 border-t border-black/10 pt-5">
        <!-- The IC2 logo is white, so it sits on a dark tile to stay visible. -->
        <span class="bg-dark-khaki-900 flex shrink-0 items-center rounded-md px-2">
          <img
            src="../../assets/imgs/ic2_logo.png"
            alt="IC2 logo"
            class="h-12 w-auto object-contain"
          />
        </span>
        <p class="text-xs leading-snug text-black/60">
          Developed by <span class="font-semibold text-black/70">IC2</span><br />
          Information and Communication Club
        </p>
      </div>
    </form>
  </div>
</template>
