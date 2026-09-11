<template>
  <table class="w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-4 text-nowrap">Name</th>
        <th class="px-4 text-nowrap">Phase Order</th>
        <th class="px-4 text-nowrap">Contestant Limit (per gender)</th>
        <th class="px-4">Action</th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr class="font-poppins" v-for="item in items" :key="item.id">
        <td class="border border-black/40 px-2 text-nowrap">{{ item.name }}</td>
        <td class="border border-black/40 px-2 text-nowrap">{{ item.phaseOrder }}</td>
        <td class="border border-black/40 px-2 text-nowrap">
          {{ item.contestantLimit ?? 'Unlimited' }}
        </td>
        <td class="border border-black/40 px-2">
          <div class="flex h-12 items-center justify-center gap-4">
            <button
              @click="emit('edit', item.id)"
              class="bg-custom-light-brown1/50 hover:bg-custom-light-brown1/30 h-10 cursor-pointer rounded-xl border border-black/10 px-6"
            >
              Edit</button
            ><button
              @click="emit('delete', item.id)"
              class="bg-main-dark-brown hover:bg-main-dark-brown/70 h-10 cursor-pointer rounded-xl border border-black/10 px-6 text-white"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script setup lang="ts">
import type { GetRoundsListDTO } from '@/types/admin/adminSetup/rounds/rounds';

defineProps<{
  items: GetRoundsListDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
}>();
</script>
