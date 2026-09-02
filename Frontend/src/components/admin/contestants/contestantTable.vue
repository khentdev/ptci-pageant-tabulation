<template>
  <table class="relative w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-2 text-nowrap">Candidate Number</th>
        <th class="px-2 text-nowrap">Name</th>
        <th class="px-2 text-nowrap">Gender</th>
        <th class="px-2 text-nowrap">Team</th>
        <th class="px-2 text-nowrap">Action</th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr class="font-poppins" v-for="contestant in items" :key="contestant.id">
        <td class="border px-2 font-bold text-nowrap">{{ contestant.candidateNumber }}</td>
        <td class="border px-2 text-nowrap">{{ contestant.name }}</td>
        <td class="border px-2 text-nowrap">{{ contestant.gender }}</td>
        <td class="border px-2 text-nowrap">{{ contestant.teamName }}</td>
        <td class="border px-2">
          <div class="flex h-12 items-center justify-center gap-4">
            <button
              @click="emit('edit', contestant.id)"
              class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 hover:bg-amber-400"
            >
              Edit
            </button>
            <button
              @click="emit('delete', contestant.id)"
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
import type { GetAllContestantsDTO } from '@/types/admin/adminSetup/contestants/contestants';

defineProps<{
  items: GetAllContestantsDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
}>();
</script>
