<script setup lang="ts">
import TheSidebarLayout from '@/components/TheSidebarLayout.vue';
import BaseSidebarLink from '@/components/shared/BaseSidebarLink.vue';
import BaseSidebarSection from '@/components/shared/BaseSidebarSection.vue';
import { type Component } from 'vue';
import { Gavel, History, Layers, Tags, Users } from '@lucide/vue';
import { RouterView } from 'vue-router';
import LiveEventRoundSidebar from '@/components/admin/liveEvent/LiveEventRoundSidebar.vue';
import { useAuthStore } from '@/stores/auth/authStore';

const authStore = useAuthStore();

type SetupNavItem = {
  label: string;
  routeName: string;
  icon: Component;
};

const setupNavItems: SetupNavItem[] = [
  { label: 'Rounds', routeName: 'rounds', icon: Layers },
  { label: 'Categories', routeName: 'categories', icon: Tags },
  { label: 'Contestants', routeName: 'contestants', icon: Users },
  { label: 'Judges & Chairman', routeName: 'judge', icon: Gavel },
];
</script>

<template>
  <TheSidebarLayout :title="authStore.isChairman ? 'CHAIRMAN' : 'ADMIN'">
    <template #nav>
      <nav aria-label="Admin" class="flex flex-col gap-6 border-t border-black/10 px-3 pt-4 pb-6">
        <BaseSidebarSection v-if="authStore.isAdmin" label="Setup">
          <BaseSidebarLink
            v-for="item in setupNavItems"
            :key="item.routeName"
            :to="{ name: item.routeName }"
            :icon="item.icon"
            :label="item.label"
          />
        </BaseSidebarSection>

        <BaseSidebarSection label="Live Event">
          <LiveEventRoundSidebar />
        </BaseSidebarSection>

        <BaseSidebarSection v-if="authStore.isAdmin || authStore.isChairman" label="Records">
          <BaseSidebarLink :to="{ name: 'audit-trail' }" :icon="History" label="Audit Trail" />
        </BaseSidebarSection>
      </nav>
    </template>

    <RouterView></RouterView>
  </TheSidebarLayout>
</template>
