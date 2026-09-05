<script setup lang="ts">
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { Calendar } from '@lucide/vue';
import { onMounted, computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const roundStore = useRoundStore();
const route = useRoute();

onMounted(async () => {
  await roundStore.getRound();
});
</script>

<template>
  <RouterLink
    v-for="round in roundStore.roundList"
    :key="round.id"
    :to="`/admin/live/results/${round.id}`"
    exact-active-class="bg-main-dark-brown text-white hover:bg-main-dark-brown"
    class="flex cursor-pointer items-center gap-4 rounded-lg border border-black/30 px-4 py-2 hover:bg-black/5 sm:p-4"
  >
    <Calendar></Calendar>

    <p class="cursor-pointer">{{ round.name }}</p>
  </RouterLink>
</template>
