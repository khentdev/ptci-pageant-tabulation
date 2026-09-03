<template>
  <table class="w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-4 text-nowrap">Name</th>
        <th class="px-4 text-nowrap">Phase Order</th>
        <th class="px-4 text-nowrap">Contestant Limit</th>
        <th class="px-4">Action</th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr class="font-poppins" v-for="item in items" :key="item.id">
        <td class="border px-2 text-nowrap">{{ item.name }}</td>
        <td class="border px-2 text-nowrap">{{ item.phaseOrder }}</td>
        <td class="border px-2 text-nowrap">{{ item.contestantLimit }}</td>
        <td class="border px-2">
          <div class="flex h-12 items-center justify-center gap-4">
            <button
              @click="emit('edit', item.id)"
              class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 text-black hover:bg-amber-400"
            >
              Edit</button
            ><button
              @click="emit('delete', item.id)"
              class="h-10 cursor-pointer rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
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
