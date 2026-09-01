<template>
  <div class="flex h-full w-full flex-col gap-4">
    <div class="flex w-full flex-col gap-8 overflow-y-auto md:h-[calc(85dvh-100px)]">
      <!--
      <BaseFetchOverlay v-if="contestantStore.loadingStates.isFetchingContestantList" />
      <ServerErrorOverlayModal
        v-else-if="contestantStore.errorStates.isFetchingContestantListError"
        title="Failed to Load Contestants"
        description="We couldn't load the contestants. Please try again."
        
      />-->
      <table class="relative w-full">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="px-2 text-nowrap">Name</th>
            <th class="px-2 text-nowrap">Username</th>
            <th class="w-100 px-2 text-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <tr class="font-poppins" v-for="judge in judgeStore.judgeList" :key="judge.id">
            <td class="border px-2 text-nowrap">{{ judge.name }}</td>
            <td class="border px-2 text-nowrap">{{ judge.username }}</td>
            <td class="border px-2">
              <div class="flex h-15 items-center justify-center gap-4">
                <button
                  @click="emit('editContestant', judge.id)"
                  class="h-12 cursor-pointer rounded-xl bg-amber-300 px-6 hover:bg-amber-400"
                >
                  Edit
                </button>
                <button
                  @click="emit('resetPassJudge', judge.id)"
                  class="h-12 cursor-pointer rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
                >
                  Reset Password
                </button>
                <button
                  @click="judgeStore.deleteJudge(judge.id)"
                  class="h-12 cursor-pointer rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useContestantStore } from '@/stores/admin/adminSetup/contestants/contestantStore';
import type { Gender } from '@/types/admin/adminSetup/contestants/contestants';
import { useRoute, useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import BaseFetchOverlay from '@/components/shared/BaseFetchOverlay.vue';
import ServerErrorOverlayModal from '@/components/shared/modal/ServerErrorOverlayModal.vue';
import { useJudgeStore } from '@/stores/admin/adminSetup/judge/judgeStore';
import { useModalStore } from '@/stores/modals/modalStore';

const route = useRoute();
const modalStore = useModalStore();
const judgeStore = useJudgeStore();
const emit = defineEmits<{ editContestant: [id: number]; resetPassJudge: [id: number] }>();
</script>
