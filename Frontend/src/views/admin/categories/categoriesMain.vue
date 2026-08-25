<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted } from 'vue';
import CategoriesTable from '@/components/admin/categories/categoriesTable.vue';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import AddCategory from '@/components/admin/categories/addCategory.vue';
import EditCategory from '@/components/admin/categories/editCategory.vue';
import FieldsCategory from '@/components/admin/categories/fieldsCategory.vue';

const modalStore = useModalStore();
const categoryStore = useCategoryStore();

onMounted(() => {
  categoryStore.getCategoryList();
});
</script>

<template>
  <AddCategory :showModal="modalStore.isAddCategoryVisible" />
  <EditCategory :showModal="modalStore.isEditCategoryVisible" />
  <FieldsCategory
    :showModal="modalStore.isFieldCategoryVisible"
    :categoryId="categoryStore.selectedCategoryId"
  />
  <div
    class="bg-main-light-brown font-poppins relative flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Categories Management</p>
      <button
        @click="modalStore.toggleAddCategory()"
        class="bg-jungle-green-800 hover:bg-jungle-green-900 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Category
      </button>
    </div>

    <div class="flex w-full flex-col gap-8 overflow-y-auto md:h-[calc(100dvh-100px)]">
      <CategoriesTable />
    </div>
  </div>
</template>
