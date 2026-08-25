<script setup lang="ts">
import RoundsTable from '@/components/admin/rounds/roundsTable.vue';
import { Plus } from '@lucide/vue';
import { useModalStore } from '@/stores/modals/modalStore';
import { useRoundStore } from '@/stores/admin/adminSetup/round/roundStore';
import { onMounted } from 'vue';
import CategoriesTable from '@/components/admin/categories/categoriesTable.vue';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';

const modalStore = useModalStore();
const roundStore = useRoundStore();
const categoryStore = useCategoryStore();

const addCategory = () => {
  modalStore.toggleAddCategory();
};

onMounted(() => {
  categoryStore.getCategoryList();
});
</script>

<template>
  <div
    class="bg-main-light-brown font-poppins flex h-full w-full flex-col items-center gap-2 rounded-xl border border-black/20 px-6 py-4 drop-shadow-sm drop-shadow-black/10"
  >
    <div class="flex w-full justify-between gap-2">
      <p class="font-semibold text-black/70 sm:text-2xl">Categories Management</p>
      <button
        @click="addCategory"
        class="bg-jungle-green-800 flex h-10 items-center gap-2 rounded-xl p-4 text-xs text-white sm:h-15 sm:text-base"
      >
        <Plus class="stroke-white stroke-2 sm:h-8 sm:w-8"></Plus> Add Category
      </button>
    </div>

    <div class="flex w-full flex-col gap-8 overflow-y-auto md:h-[calc(100dvh-100px)]">
      <CategoriesTable></CategoriesTable>
    </div>
  </div>
</template>
