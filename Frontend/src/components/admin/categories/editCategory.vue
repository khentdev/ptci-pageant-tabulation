<template>
  <div
    @click.self="modalStore.toggleEditCategory()"
    v-if="showModal"
    class="font-poppins fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4 sm:p-0"
  >
    <div class="flex flex-col items-center rounded-xl bg-amber-200 sm:w-lg">
      <div class="flex w-full justify-between p-4 text-2xl">
        <p class="">Edit Category</p>
      </div>

      <div class="flex w-full flex-col justify-center gap-4 p-4">
        <div class="w-full">
          <p>Round Name</p>

          <input
            readonly
            type="text"
            name=""
            id=""
            class="h-10 w-full border border-black"
            :placeholder="`${categoryStore.categoryId?.roundName}`"
          />
          <div v-if="false" class="mt-1 flex h-full w-full justify-start">
            <p class="flex gap-1 px-1 text-sm text-red-500 sm:gap-2 sm:text-base">
              <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert>{{}}
            </p>
          </div>
        </div>

        <div class="w-full">
          <p>Category Name</p>
          <input
            @input="clearError"
            v-model="newCategoryName"
            :readonly="categoryStore.categoryId?.isLocked === true"
            type="text"
            class="h-10 w-full border border-black"
            :placeholder="`${categoryStore.categoryId?.name}`"
          />

          <div
            v-if="categoryStore.isCategoryNameInvalid"
            class="mt-1 flex h-full w-full justify-start"
          >
            <p class="flex gap-1 px-1 text-sm text-red-500 sm:gap-2 sm:text-base">
              <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert
              >{{ categoryStore.isCategoryNameInvalid }}
            </p>
          </div>
        </div>
      </div>

      <div class="m-4 flex w-full items-start justify-center gap-4">
        <button @click="modalStore.toggleEditCategory()" class="border border-black p-4">
          Cancel
        </button>
        <button @click="editCategory" class="border border-black p-4">Save Changes</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import { useModalStore } from '@/stores/modals/modalStore';
import type { EditCategoryInput } from '@/types/admin/adminSetup/category/categories';
import { ref } from 'vue';
import { CircleAlert } from '@lucide/vue';
const modalStore = useModalStore();
const categoryStore = useCategoryStore();

const newCategoryName = ref('');

defineProps<{
  showModal: boolean;
}>();

const clearError = () => {
  if (categoryStore.isCategoryNameInvalid) {
    categoryStore.isCategoryNameInvalid = '';
  }
};

const editCategory = () => {
  if (!categoryStore.categoryId?.id) {
    return;
  }

  const category: EditCategoryInput = {
    id: categoryStore.categoryId?.id,
    name: newCategoryName.value,
  };

  categoryStore.editCategory(category);
  newCategoryName.value = '';
};
</script>
