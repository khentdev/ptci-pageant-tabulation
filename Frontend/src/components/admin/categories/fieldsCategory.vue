<template>
  <div
    @click.self="modalStore.toggleFieldCategory()"
    v-if="showModal"
    class="font-poppins fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4 sm:p-0"
  >
    <div class="flex flex-col gap-4 rounded-xl bg-amber-200 sm:w-lg">
      <div class="flex w-full justify-between p-4 text-2xl">
        <p class="">{{ categoryStore.categoryFields?.categoryName }} ╾ Scoring Fields</p>
      </div>

      <div class="h-50 w-full overflow-y-auto">
        <FieldTable></FieldTable>
      </div>
      <div class="px-2">
        <button @click="addRow" class="bg-jungle-green-500 px-6 py-2">Add Row</button>
      </div>
      <div class="flex gap-2 px-2">
        <p>Total: {{ totalMaxValue }} / 100</p>
        <Check v-if="totalMaxValue === 100" class="stroke-jungle-green-700"></Check>
        <TriangleAlert v-if="totalMaxValue < 100" class="h-5 w-5 stroke-red-500"></TriangleAlert>
      </div>
      <div class="mb-4 flex w-full items-start justify-center gap-4">
        <button @click="modalStore.toggleFieldCategory()" class="border border-black p-4">
          Cancel
        </button>
        <button
          :class="categoryStore.buttonDisabled"
          :disabled="categoryStore.categoryFields?.isLocked === true"
          @click="handleSaveCategoryFields"
          class="border border-black p-4"
        >
          Save Fields
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted, ref, computed } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/round/roundStore.ts';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import type {
  AddCategoryInput,
  SaveCategoryFieldsInput,
} from '@/types/admin/adminSetup/category/categories';
import { CircleAlert, Check, TriangleAlert } from '@lucide/vue';
import FieldTable from './fieldTable.vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const categoryStore = useCategoryStore();

const totalMaxValue = computed(() => {
  return categoryStore.categoryFieldInput.reduce((sum, row) => {
    const val = parseFloat(row.maxValue);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
});

const addRow = () => {
  categoryStore.categoryFieldInput.push({ name: '', maxValue: '' });
};

const handleSaveCategoryFields = () => {
  const categoryFields: SaveCategoryFieldsInput = {
    categoryId: props.categoryId,
    fields: categoryStore.categoryFieldInput.map((f) => ({
      name: f.name,
      maxValue: String(f.maxValue),
    })),
  };
  categoryStore.saveCategoryFields(categoryFields);
};

const props = defineProps<{
  showModal: boolean;
  categoryId: number;
}>();
</script>
