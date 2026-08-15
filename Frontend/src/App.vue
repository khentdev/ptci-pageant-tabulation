<script setup lang="ts">
import { RouterView } from 'vue-router';
import BaseSessionOverlay from './components/System/BaseSessionOverlay.vue';
import VToast from './components/Toast/VToast.vue';
</script>

<template>
 <router-view v-slot="{ Component }">
    <VToast />
        <BaseSessionOverlay>
            <component :is="Component" />
        </BaseSessionOverlay>
 </router-view>
</template>
