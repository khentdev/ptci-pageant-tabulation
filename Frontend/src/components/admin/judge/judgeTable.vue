<template>
  <table class="relative w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-2 text-nowrap">Name</th>
        <th class="px-2 text-nowrap">Username</th>
        <th class="min-w-100 px-2 text-nowrap">Actions</th>
      </tr>
    </thead>
    <tbody class="w-full">
      <tr class="font-poppins" v-for="judge in items" :key="judge.id">
        <td class="border px-2 text-nowrap">{{ judge.name }}</td>
        <td class="border px-2 text-nowrap">{{ judge.username }}</td>
        <td class="border px-2">
          <div class="flex h-12 items-center justify-center gap-4">
            <button
              @click="emit('edit', judge.id)"
              class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 hover:bg-amber-400"
            >
              Edit
            </button>
            <button
              @click="emit('resetPassword', judge.id)"
              class="h-10 cursor-pointer shrink-0 rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
            >
              Reset Password
            </button>
            <button
              @click="emit('delete', judge.id)"
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
import type { GetJudgeListDTO } from '@/types/admin/adminSetup/judge/judge';

defineProps<{
  items: GetJudgeListDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  resetPassword: [id: number];
}>();
</script>
