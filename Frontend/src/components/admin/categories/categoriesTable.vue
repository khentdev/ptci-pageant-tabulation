<script setup lang="ts">
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore.ts';
import { useModalStore } from '@/stores/modals/modalStore';
import type {
  DeleteCategoryInput,
  GetCategoryFieldsInput,
} from '@/types/admin/adminSetup/category/categories';
import { Check } from '@lucide/vue';
const categoryStore = useCategoryStore();
const modalStore = useModalStore();

const getCategoryId = async (id: number) => {
  localStorage.setItem('category-id', JSON.stringify(id));
  await categoryStore.getCategoryId(id);
  modalStore.toggleEditCategory();
};

const getCategoryFieldsId = async (categoryId: number) => {
  categoryStore.selectedCategoryId = categoryId;
  await categoryStore.getCategoryFieldsId(categoryId);
  modalStore.toggleFieldCategory();
};

const handleDeleteCategory = (deleteCategoryInput: number) => {
  categoryStore.deleteCategory(deleteCategoryInput);
};
</script>

<template>
  <table v-for="round in categoryStore.categoryList" :key="round.id" class="relative w-full">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="px-2 text-nowrap">{{ round.name }}</th>
        <th class="px-2 text-nowrap">Criteria Fields</th>
        <th class="px-2 text-nowrap">Actions</th>
      </tr>
    </thead>
    <tbody class="w-full">
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
            ></Check>
          </div>
        </td>
        <td class="border px-2">
          <div class="flex h-12 items-center justify-center gap-4">
            <button @click="getCategoryId(categories.id)" class="px-6 h-10 rounded-xl bg-amber-300 hover:bg-amber-400 text-black cursor-pointer">
              Edit
            </button>
            <button
              @click="getCategoryFieldsId(categories.id)"
              class="px-6 h-10 rounded-xl bg-amber-300 hover:bg-amber-400 text-black cursor-pointer"
            >
              Fields</button
            ><button
              @click="handleDeleteCategory(categories.id)"
              class="px-6 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
