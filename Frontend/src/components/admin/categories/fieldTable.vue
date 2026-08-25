<template>
  <table class="relative w-full bg-amber-500">
    <thead class="sticky top-0 z-20 h-full rounded-xl">
      <tr class="bg-main-dark-brown h-10 text-left text-sm text-white sm:h-20 sm:text-xl">
        <th class="w-10 text-center">Id</th>
        <th class="text-center">Field Name</th>
        <th class="text-center">Max Score</th>
        <th class="text-center">Action</th>
      </tr>
    </thead>
    <tbody class="w-full">
      <!-- this is the part to loop it using v-for -->
      <tr v-for="(field, index) in categoryStore.categoryFieldInput" :key="index">
        <td class="border text-center">{{ index + 1 }}</td>
        <td class="border text-center">
          <div class="">
            <input v-model="field.name" class="h-full w-full text-center outline-0" type="text" />
          </div>
        </td>
        <td class="border text-center">
          <div class="">
            <input
              v-model="field.maxValue"
              class="h-full w-full text-center outline-0"
              type="text"
            />
          </div>
        </td>

        <td class="border">
          <div class="flex h-12 items-center justify-center gap-4">
            <button
              :class="categoryStore.buttonDisabled"
              :disabled="categoryStore.categoryFields?.isLocked === true"
              @click="removeRow(index)"
              class="h-10 rounded-xl bg-amber-300 px-6"
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
import { useCategoryStore } from '@/stores/admin/adminSetup/category/categoryStore';
import { ref, watch } from 'vue';
const categoryStore = useCategoryStore();

const removeRow = (i: number) => {
  categoryStore.categoryFieldInput.splice(i, 1);
};
</script>
