<script setup lang="ts">
import { RouterView } from 'vue-router';
import BaseSessionOverlay from './components/System/BaseSessionOverlay.vue';
import VToast from './components/Toast/VToast.vue';
import AddRounds from './components/admin/rounds/addRounds.vue';
import { useModalStore } from './stores/modals/modalStore.ts';
import EditRounds from './components/admin/rounds/editRounds.vue';
const modalStore = useModalStore();
</script>

<template>
  <AddRounds :showModal="modalStore.isAddRoundsVisible"></AddRounds>
  <EditRounds :showModal="modalStore.isEditRoundsVisible"></EditRounds>
  <router-view v-slot="{ Component }">
    <VToast />
    <BaseSessionOverlay>
      <component :is="Component" />
    </BaseSessionOverlay>
  </router-view>
</template>
