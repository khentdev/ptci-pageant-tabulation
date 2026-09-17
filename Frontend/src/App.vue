<script setup lang="ts">
import { RouterView } from 'vue-router';
import SessionOverlay from './components/system/SessionOverlay.vue';
import AppToast from './components/toast/AppToast.vue';
</script>

<template>
  <router-view v-slot="{ Component }">
    <AppToast />
    <SessionOverlay>
      <component :is="Component" />
    </SessionOverlay>
  </router-view>
</template>
