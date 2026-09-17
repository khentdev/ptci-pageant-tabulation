<script setup lang="ts">
import TheSidebarLayout from '@/components/TheSidebarLayout.vue';
import BaseSidebarSection from '@/components/shared/BaseSidebarSection.vue';
import { RouterView } from 'vue-router';

import JudgeScoringRoundSidebar from '@/components/judge/JudgeScoringRoundSidebar.vue';
</script>

<template>
  <TheSidebarLayout title="JUDGE">
    <template #nav>
      <nav aria-label="Judge" class="flex flex-col gap-6 border-t border-black/10 px-3 pt-4 pb-6">
        <BaseSidebarSection label="Rounds">
          <JudgeScoringRoundSidebar />
        </BaseSidebarSection>
      </nav>
    </template>

    <RouterView></RouterView>
  </TheSidebarLayout>
</template>
