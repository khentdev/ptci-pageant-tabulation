<template>
  <div class="gap flex w-full flex-col items-start gap-2">
    <div class="mt-4 flex items-center justify-between gap-2">
      <p class="text-xl font-medium text-black/70">Tie Resolution</p>
      <triangle-alert class="stroke animate-pulse fill-yellow-300 stroke-black/70"></triangle-alert>
    </div>

    <div
      class="bg-main-dark-brown flex h-full flex-col justify-center rounded-lg px-6 py-4 text-white"
    >
      <p class="my-4">Select 1 more to fill remaining spot</p>
      <div
        class="flex items-end justify-between bg-amber-100"
        v-for="contestants in liveStore.roundResult?.advancement.tied"
        :key="contestants.id"
      >
        <div class="mt-2 flex items-center gap-2">
          <input type="checkbox" class="size-4" id="tie" />
          <label for="tie">{{ contestants.name }}</label>
        </div>
        <p class="font-bold">{{ contestants.overallScore }}</p>
      </div>
      <div class="flex items-center gap-2">
        <p>Selected: {{ liveStore.roundResult?.advancement.requiredSelections }} of 1 required</p>
        <check
          v-if="liveStore.roundResult?.advancement.requiredSelections === 1"
          class="stroke stroke-jungle-green-700"
        ></check>
        <x
          v-else-if="liveStore.roundResult?.advancement.requiredSelections === 0"
          class="stroke stroke-red-500"
        ></x>
      </div>
      <div class="mt-4 flex items-center justify-center gap-4">
        <button
          class="border-main-light-brown hover:bg-main-light-brown/30 w-full cursor-pointer rounded-lg border p-4 text-white"
        >
          Cancel
        </button>
        <button
          class="bg-main-light-brown hover:bg-main-light-brown/80 w-full cursor-pointer rounded-lg p-4 text-black/70"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLiveStore } from '@/stores/admin/adminLive/liveStore';
import { Check, TriangleAlert, X } from '@lucide/vue';
const liveStore = useLiveStore();
</script>
