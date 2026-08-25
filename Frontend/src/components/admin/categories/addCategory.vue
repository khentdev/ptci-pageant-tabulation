<template>
  <div
    @click.self="modalStore.toggleAddCategory()"
    v-if="showModal"
    class="font-poppins fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4 sm:p-0"
  >
    <div class="flex flex-col items-center rounded-xl bg-amber-200 sm:w-lg">
      <div class="flex w-full justify-between p-4 text-2xl">
        <p class="">Add Category</p>
      </div>

      <div class="flex w-full flex-col justify-center gap-4 p-4">
        <div class="w-full">
          <p>Round Name</p>
          <select v-model="selectedRound" class="h-10 w-full border border-black">
            <option :value="''" disabled>Select a round</option>
            <option v-for="item in roundStore.roundList" :key="item.id" :value="String(item.id)">
              {{ item.name }}
            </option>
          </select>

          <div
            v-if="categoryStore.isCategoryRoundInvalid"
            class="mt-1 flex h-full w-full justify-start"
          >
            <p class="flex gap-1 px-1 text-sm text-red-500 sm:gap-2 sm:text-base">
              <CircleAlert class="stroke-red-500 stroke-2"></CircleAlert
              >{{ categoryStore.isCategoryRoundInvalid }}
            </p>
          </div>
        </div>

        <div class="w-full">
          <p>Category Name</p>
          <input
            v-model="newCategoryName"
            type="text"
            name=""
            id=""
            class="h-10 w-full border border-black"
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
        <button @click="modalStore.toggleAddCategory()" class="border border-black p-4">
          Cancel
        </button>
        <button @click="addCat" class="border border-black p-4">Add Category</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useModalStore } from '@/stores/modals/modalStore';
import { onMounted, ref } from 'vue';
import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore';
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import type { AddCategoryInput } from '@/types/admin/adminSetup/category/categories';
import { CircleAlert } from '@lucide/vue';

const roundStore = useRoundStore();
const modalStore = useModalStore();
const categoryStore = useCategoryStore();

defineProps<{
  showModal: boolean;
}>();

const newCategoryName = ref('');
const selectedRound = ref('');

const addCat = async () => {
  if (!selectedRound.value) {
    return;
  }
  const category: AddCategoryInput = {
    name: newCategoryName.value,
    roundId: selectedRound.value,
  };

  await categoryStore.addCategory(category);
};

onMounted(() => {
  roundStore.getRound();
});
</script>
