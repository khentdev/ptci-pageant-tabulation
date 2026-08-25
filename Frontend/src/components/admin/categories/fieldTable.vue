<template>
  <table class="relative w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-lg">
        <th class="text-nowrap px-2">ID</th>
        <th class="text-nowrap px-2">Field Name</th>
        <th class="text-nowrap px-2">Max Score</th>
        <th class="text-nowrap px-2">Action</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(field, index) in fieldRows" :key="index">
        <td class="border px-2 text-xs font-bold sm:text-sm  border-black">{{ index + 1 }}</td>
        <td class="border">
            <input
              v-model="field.name"
              :readonly="isLocked"
              class="block h-full min-h-12 w-full px-2 text-xs outline-0 sm:text-sm read-only:cursor-not-allowed read-only:bg-gray-300"
              type="text"
            />
        </td>
        <td class="border">
            <input
              v-model="field.maxValue"
              :readonly="isLocked"
              inputmode="decimal"
              class="block h-full min-h-12 w-full px-2 text-xs outline-0 sm:text-sm read-only:cursor-not-allowed read-only:bg-gray-300"
              type="text"
            />
        </td>
        <td class="border">
          <div class="flex h-full items-center justify-center px-2 sm:px-4">
            <button
              type="button"
              :disabled="isLocked"
              @click="emit('removeRow', index)"
              class="disabled:cursor-not-allowed hover:bg-amber-400 cursor-pointer disabled:opacity-50 h-8 rounded-lg bg-amber-300 px-3 text-xs sm:h-10 sm:rounded-xl sm:px-6 sm:text-sm"
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { CategoryFieldInput } from '@/types/admin/adminSetup/category/categories';
import { watch } from 'vue';

const props = defineProps<{
  fieldRows: CategoryFieldInput[];
  isLocked: boolean;
}>();

const emit = defineEmits<{
  removeRow: [index: number];
}>();

const cleanMaxScore = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');

  const endsWithDot = cleaned.endsWith('.');
  const parts = cleaned.split('.').filter(Boolean);

  const integerPart = parts[0] ?? '';
  const decimalPart = parts[1] ? parts[1].slice(0, 2) : '';

  if (endsWithDot && !decimalPart) {
    return integerPart ? `${integerPart}.` : '';
  }

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
};

watch(
  () => props.fieldRows.map((row) => row.maxValue),
  (maxValues) => {
    maxValues.forEach((maxValue, index) => {
      const row = props.fieldRows[index];
      if (!row) {
        return;
      }

      row.maxValue = cleanMaxScore(maxValue ?? '');
    });
  },
);
</script>
