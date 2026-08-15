<script setup lang="ts">
import { Plus } from '@lucide/vue';
</script>

<template>
  <div
    class="bg-main-light-brown font-poppins flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Round Management</p>
      <button
        class="bg-jungle-green-800 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Rounds
      </button>
    </div>

    <div class="flex h-full w-full">
      <table class="w-full table-fixed">
        <thead class="rounded-xl">
          <tr class="bg-main-dark-brown text-sm text-white sm:h-20 sm:text-xl">
            <th>Name</th>
            <th>Phase Order</th>
            <th>Contestant Limit</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody class="w-full">
          <tr class="w-screen flex">
            <td class="border px-2">Preliminary</td>
            <td class="justify-center border">1</td>
            <td class="border">Unlimited</td>
            <td class="border flex"><button>Edit</button><button>Delete</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
