<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted, ref } from 'vue';
import CategoryTable from '@/components/admin/categories/CategoryTable.vue';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import CategoryAddModal from '@/components/admin/categories/CategoryAddModal.vue';
import CategoryEditModal from '@/components/admin/categories/CategoryEditModal.vue';
import CategoryFieldsModal from '@/components/admin/categories/CategoryFieldsModal.vue';
import BasePanel from '@/components/shared/BasePanel.vue';

const modalStore = useModalStore();
const categoryStore = useCategoryStore();

const selectedCategoryId = ref(0);
const selectedFieldsCategoryId = ref(0);

const openEditCategory = (id: number) => {
  localStorage.setItem('category-id', JSON.stringify(id));
  selectedCategoryId.value = id;
  modalStore.toggleEditCategory();
};

const openFieldsCategory = (id: number) => {
  selectedFieldsCategoryId.value = id;
  modalStore.toggleFieldCategory();
};

const handleDelete = async (id: number) => {
  await categoryStore.deleteCategory(id);
};

onMounted(async () => {
  await categoryStore.getCategoryList();
});
</script>

<template>
  <CategoryAddModal :showModal="modalStore.isAddCategoryVisible" />
  <CategoryEditModal
    :showModal="modalStore.isEditCategoryVisible"
    :categoryId="selectedCategoryId"
  />
  <CategoryFieldsModal
    :showModal="modalStore.isFieldCategoryVisible"
    :categoryId="selectedFieldsCategoryId"
  />
  <BasePanel
    title="Categories Management"
    addButtonLabel="Add Category"
    :isLoading="categoryStore.loadingStates.isFetchingCategoryList"
    :isError="categoryStore.errorStates.isFetchingCategoryListError"
    errorTitle="Failed to Load Categories"
    errorDescription="We couldn't load the categories. Please try again."
    :onRetry="categoryStore.getCategoryList"
    @add="modalStore.toggleAddCategory()"
  >
    <CategoryTable
      :items="categoryStore.categoryList"
      @edit="openEditCategory"
      @delete="handleDelete"
      @open-fields="openFieldsCategory"
    />
  </BasePanel>
</template>
