<template>
  <BaseTable>
    <template #head>
      <BaseTableHeader>ID</BaseTableHeader>
      <BaseTableHeader>Field Name</BaseTableHeader>
      <BaseTableHeader>Max Score</BaseTableHeader>
      <BaseTableHeader>Action</BaseTableHeader>
    </template>
    <tr v-for="(field, index) in fieldRows" :key="index">
      <BaseTableCell class="text-xs font-bold sm:text-sm">{{ index + 1 }}</BaseTableCell>
      <BaseTableCell flush>
        <input
          v-model="field.name"
          :readonly="isLocked"
          class="block h-full min-h-12 w-full px-2 text-xs outline-0 read-only:cursor-not-allowed read-only:bg-gray-300 sm:text-sm"
          type="text"
        />
      </BaseTableCell>
      <BaseTableCell flush>
        <input
          v-model="field.maxValue"
          :readonly="isLocked"
          inputmode="decimal"
          class="block h-full min-h-12 w-full px-2 text-xs outline-0 read-only:cursor-not-allowed read-only:bg-gray-300 sm:text-sm"
          type="text"
        />
      </BaseTableCell>
      <BaseTableCell flush>
        <div class="flex h-full items-center justify-center px-2 sm:px-4">
          <button
            type="button"
            :disabled="isLocked"
            @click="emit('removeRow', index)"
            class="h-8 cursor-pointer rounded-lg border border-red-600 px-3 text-xs font-medium text-red-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 enabled:hover:bg-red-600 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:rounded-xl sm:px-6 sm:text-sm"
          >
            Remove
          </button>
        </div>
      </BaseTableCell>
    </tr>
  </BaseTable>
</template>

<script setup lang="ts">
import type { CategoryFieldInput } from '@/types/admin/adminSetup/category/categories';
import { watch } from 'vue';
import BaseTable from '@/components/shared/table/BaseTable.vue';
import BaseTableHeader from '@/components/shared/table/BaseTableHeader.vue';
import BaseTableCell from '@/components/shared/table/BaseTableCell.vue';

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
