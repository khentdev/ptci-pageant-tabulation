<template>
  <div class="gap flex w-full flex-col gap-2">
    <div class="mt-4 flex justify-between">
      <p class="text-xl font-medium text-black/70">Judge Submissions</p>
      <div class="flex gap-2">
        <p>
          {{ liveStore.judgeList?.fullySubmittedCount }}/{{ liveStore.judgeList?.totalJudges }}
          Submitted
        </p>
        <Check
          v-if="liveStore.judgeList?.allJudgesSubmitted === true"
          class="stroke stroke-jungle-green-700"
        ></Check>
        <X
          v-else-if="liveStore.judgeList?.allJudgesSubmitted === false"
          class="stroke stroke-red-500"
        ></X>
      </div>
    </div>

    <div class="">
      <table class="w-full border-collapse">
        <thead class="sticky top-0 z-20 h-full rounded-xl">
          <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
            <th class="border-black/70 px-2 text-nowrap">Judge</th>
            <th
              class="border-black/70 px-2 text-nowrap"
              v-for="categories in liveStore.judgeList?.judgeSubmissions[0]?.categories"
              :key="categories.id"
            >
              {{ categories.name }}
            </th>
            <th class="border-black/70 px-2 text-nowrap">Submitted</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <tr
            class="font-poppins"
            v-for="j in liveStore.judgeList?.judgeSubmissions"
            :key="j.judge.id"
          >
            <td class="border border-black/40 p-2 text-nowrap">{{ j.judge.name }}</td>
            <td
              class="border border-black/40 p-2"
              v-for="categories in j.categories"
              :key="categories.id"
            >
              <div class="flex items-center justify-center">
                <Check
                  v-if="categories.submitted === true"
                  class="stroke stroke-jungle-green-800"
                ></Check
                ><X v-else-if="categories.submitted === false" class="stroke stroke-red-500"></X>
              </div>
            </td>
            <td class="border border-black/40 p-2 text-nowrap">
              <div class="flex items-center justify-center">
                <Check
                  v-if="j.fullySubmitted === true"
                  class="stroke stroke-jungle-green-800"
                ></Check
                ><X v-else-if="j.fullySubmitted === false" class="stroke stroke-red-500"></X>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Check, X } from '@lucide/vue';
const liveStore = useLiveStore();
</script>
