<script setup lang="ts">
import { Check } from '@lucide/vue';
import type { GetCategoryListDTO } from '@/types/admin/adminSetup/category/categories';

defineProps<{
  items: GetCategoryListDTO[];
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  openFields: [id: number];
}>();
</script>

<template>
  <div class="flex flex-col gap-8">
    <table v-for="round in items" :key="round.id" class="relative w-full">
      <thead class="sticky top-0 z-20 h-full rounded-xl">
        <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
          <th class="px-2 text-nowrap">{{ round.name }}</th>
          <th class="px-2 text-nowrap">Criteria Fields</th>
          <th class="px-2 text-nowrap">Actions</th>
        </tr>
      </thead>
      <tbody class="w-full">
        <tr v-if="round.categories.length === 0" class="font-poppins">
          <td colspan="3" class="border px-4 py-6 text-center">
            <p class="text-sm text-black/70">No categories yet for this round.</p>
            <p class="mt-1 text-xs text-black/50">Use Add Category above and select this round.</p>
          </td>
        </tr>
        <tr v-for="categories in round.categories" :key="categories.id" class="font-poppins">
          <td class="border px-2 text-nowrap">
            {{ categories.name }}
          </td>
          <td class="border px-2 text-nowrap">
            <div class="flex h-full w-full items-center justify-center gap-4">
              {{ categories.fieldCount === 0 ? 'No fields' : categories.fieldCount
              }}<Check
                v-if="categories.fieldCount > 0 && categories.totalScore === 100"
                class="stroke stroke-green-500"
              />
            </div>
          </td>
          <td class="border px-2">
            <div class="flex h-12 items-center justify-center gap-4">
              <button
                @click="emit('edit', categories.id)"
                class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 hover:bg-amber-400"
              >
                Edit
              </button>
              <button
                @click="emit('openFields', categories.id)"
                class="h-10 cursor-pointer rounded-xl bg-amber-300 px-6 hover:bg-amber-400"
              >
                Fields
              </button>
              <button
                @click="emit('delete', categories.id)"
                class="h-10 cursor-pointer rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
