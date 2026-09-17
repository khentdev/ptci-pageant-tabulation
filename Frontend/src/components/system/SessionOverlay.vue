<template>
    <SessionRefreshLoading v-if="authStore.loadingStates.isRefreshingSession" />
    <SessionRefreshError v-else-if="authStore.systemErrors.sessionError" />
    <slot v-else />
</template>
<script setup lang="ts">
import SessionRefreshError from './SessionRefreshError.vue';
import SessionRefreshLoading from './SessionRefreshLoading.vue';
import { useAuthStore } from '@/stores/auth/authStore';
import { watch } from 'vue';
  import { useNetworkStatus } from '@/composables/useNetworkStatus';
  import { useToast } from '@/composables/Toast/useToast';
import { useRoute } from 'vue-router';

  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
 const authStore = useAuthStore();
const route = useRoute();

    watch(isOnline, (online, wasOnline) => {
        if (route.meta.isAuthPage) {
            return;
        }
        if (!online) {
            // eslint-disable-next-line quotes
            toast.warning("You're offline. Check your connection.");
        } else if (wasOnline === false) {
            // eslint-disable-next-line quotes
            toast.info("You're back online.");
        }
    });
</script>